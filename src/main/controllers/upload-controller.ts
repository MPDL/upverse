import { calcChecksum, getUploadUrls, uploadSinglepartToStore, uploadMultipartToStore, completeMultipartUpload, abortMultipartUpload, addMultipleFilesToDataset } from '../services/upload-service';

import { FileInfo } from '../../model/file-info';
import { IpcMainEvent, Notification, dialog } from "electron";
import { Observable } from 'rxjs';

let abort = false;

export const setAbort = new Observable((subscriber) => {
    abort = true;
    subscriber.next(abort);
})

export const filesTransfer = (event: IpcMainEvent, persistentId: string, items: FileInfo[]) => {
    return new Promise<Record<string, unknown>>(
        async (
          resolve: (values: Record<string, unknown>) => void,
          reject: (error: Error) => void
        ) => {
            try {
                const files = [];
                let uploaded = [];
                const numberOfItems = items.length;
                let itemsFailed = 0;
                let i = 0;
                let events = "";

                for (const item of items) {
                    const itemInfo: FileInfo = {
                        id: item.id,
                        name: item.name,
                        size: item.size,
                        type: item.type ? item.type : 'application/octet-stream',
                        lastModifiedDate: new Date(item.lastModifiedDate),
                        path: item.path,
                        relativePath: item.relativePath,
                        description: item.description,
                        streamed: 0,
                        uploaded: 0
                    };
                    event.sender.send('actionFor' + itemInfo.id.toString(), 'start', 0);

                    //Step 1 for direct upload: Upload files to object storage
                    let uploadUrlsResponseBody: any = null;
                    try {
                        uploadUrlsResponseBody = await getUploadUrls(persistentId, itemInfo.size);
                        if (JSON.parse(JSON.stringify(uploadUrlsResponseBody)).status != "OK") {
                            throw new Error(JSON.parse(JSON.stringify(uploadUrlsResponseBody)).status);
                        }
                    } catch (err) {
                        const title = `Error uploading file ${itemInfo.name} to store.`
                        alert(title, err.message);
                        event.sender.send('actionFor' + itemInfo.id.toString(), 'fail', 0);
                        itemsFailed++;
                        continue;
                    }

                    itemInfo.storageId = uploadUrlsResponseBody.data.storageIdentifier;
                    itemInfo.partSize = uploadUrlsResponseBody.data.partSize
                    itemInfo.storageUrls = [];
                    itemInfo.partEtags = [];

                    let uploadToStoreResponse: Electron.IncomingMessage = null;
                    if (uploadUrlsResponseBody.data.url) {
                        if (abort) {
                            try {
                                abort = false;
                                return {
                                    numFiles2Upload: 0,
                                    destination: persistentId,
                                    numFilesUploaded: 0
                                };
                            } catch (err) {
                                const title = 'Error aborting singlepart upload to store.';
                                throw new Error(title + '\n' + err);
                            }
                        } else {
                            itemInfo.storageUrls.push(uploadUrlsResponseBody.data.url);
                            try {
                                uploadToStoreResponse = await uploadSinglepartToStore(event, itemInfo);
                                if (JSON.parse(JSON.stringify(uploadToStoreResponse))._responseHead.statusCode != 200) {
                                    throw new Error('HTTP ' + JSON.parse(JSON.stringify(uploadToStoreResponse))._responseHead.statusMessage);
                                }
                            } catch (err) {
                                const title = `Error uploading file ${itemInfo.name} to store.`
                                alert(title, err.message);
                                event.sender.send('actionFor' + itemInfo.id.toString(), 'fail', 0);
                                itemsFailed++;
                                continue;
                            }
                            const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));
                            itemInfo.etag = responseHeaders.etag.replace(/^"+|"+$/g, ''); //Trim quotes from begin and end of etag
                        }
                    } else if (uploadUrlsResponseBody.data.urls) {
                        itemInfo.complete = uploadUrlsResponseBody.data.complete;
                        itemInfo.abort = uploadUrlsResponseBody.data.abort;
                        for (const key in uploadUrlsResponseBody.data.urls) {
                            itemInfo.storageUrls.push(uploadUrlsResponseBody.data.urls[key]);
                            try {
                                uploadToStoreResponse = await uploadMultipartToStore(event, itemInfo);
                                if (JSON.parse(JSON.stringify(uploadToStoreResponse))._responseHead.statusCode != 200) {
                                    throw new Error('HTTP ' + JSON.parse(JSON.stringify(uploadToStoreResponse))._responseHead.statusMessage);
                                }
                            } catch (err) {
                                const title = `Error uploading part of file ${itemInfo.name} to store.`
                                alert(title, err.message);
                                throw new Error(title + '\n' + err);
                            }
                            const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));
                            itemInfo.partEtags[Number(key)] = responseHeaders.etag.replace(/^"+|"+$/g, '');
                        }

                        if (abort) {
                            try {
                                const completeMultipartResponse = await abortMultipartUpload(itemInfo, uploadUrlsResponseBody.data.abort);
                                if (JSON.parse(JSON.stringify(completeMultipartResponse))._responseHead.statusCode != 200) {
                                    throw new Error('HTTP ' + JSON.parse(JSON.stringify(completeMultipartResponse))._responseHead.statusMessage);
                                }
                                abort = false;
                                return {
                                    numFiles2Upload: 0,
                                    destination: persistentId,
                                    numFilesUploaded: 0
                                };
                            } catch (err) {
                                const title = 'Error aborting multipart upload.';
                                alert(title, err.message);
                                throw new Error(title + '\n' + err);
                            }
                        } else {
                            try {
                                const completeMultipartResponse = await completeMultipartUpload(itemInfo, uploadUrlsResponseBody.data.complete);
                                if (JSON.parse(JSON.stringify(completeMultipartResponse))._responseHead.statusCode != 200) {
                                    throw new Error('HTTP ' + JSON.parse(JSON.stringify(completeMultipartResponse))._responseHead.statusCode);
                                }
                            } catch (err) {
                                const title = 'Error completing multipart upload to store.';
                                alert(title, err.message);
                                throw new Error(title + '\n' + err);
                            }
                            itemInfo.etag = await calcChecksum(itemInfo);
                        }
                    }

                    event.sender.send('actionFor' + itemInfo.id.toString(), 'success', 100);
                    uploaded.push(itemInfo);

                    //Step 2 for direct upload: Add file metadata after every 1000 files
                    if (uploaded.length % 1000 == 0 || i + 1 == (numberOfItems - itemsFailed)) {
                        try {
                            const addMultipleFilesResponse = await addMultipleFilesToDataset(persistentId, uploaded);
                            if (addMultipleFilesResponse._responseHead.statusCode != 200) {
                                throw new Error("HTTP " + JSON.stringify(addMultipleFilesResponse._responseHead.statusCode));
                            }
                        } catch (err) {
                            const title = 'Error adding files to dataset.';
                            throw new Error(title + '\n' + err);
                        }
                        for (const item of uploaded) {
                            files.push(item);
                        }
                        uploaded = [];
                    }
                    i++;
                }
                if (files.length) {
                    resolve({
                        numFiles2Upload: items.length,
                        destination: persistentId,
                        numFilesUploaded: files.length
                    });
                } else throw new Error("No file has been uploaded");
            } catch (err) {
                reject(err);              
            }
        }
    )
}

function alert(message: string, detail: string) {
    console.log(message);
    new Notification({ title: 'Upverse upload alert', body: message }).show();
    const options = {
      buttons: ['OK'],
      defaultId: 0,
      title: 'Upverse upload alert',
      message: message,
      detail: detail,
    };
    dialog.showMessageBox(null, options);
  }
