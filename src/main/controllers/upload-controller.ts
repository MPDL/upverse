import { calcChecksum, getUploadUrls, uploadSinglepartToStore, uploadMultipartToStore, completeMultipartUpload, addMultipleFilesToDataset  } from '../services/upload-service';

import { FileInfo } from '../../models/file-info';
import { IpcMainEvent, Notification } from "electron";

const isDev = (process.env.isDev === 'true');

export const transfer_direct_from_file = async (event: IpcMainEvent, persistentId: string, items: FileInfo[]): Promise<Record<string, unknown>> => {
    try {
        //const items = [];
        const files = [];
        let uploaded = [];
        const numberOfItems = items.length;
        let itemsFailed = 0;
        let i = 0;

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
            if (isDev) console.log('Attempting to upload ' + itemInfo.name + ' as ' + itemInfo.type + ' from ' + itemInfo.relativePath + ' at ' + Date());
            event.sender.send('actionFor' + itemInfo.id.toString(), 'start', 0);

            //Step 1 for direct upload: Upload files to object storage
            let uploadUrlsResponseBody: any = null;
            try {
                uploadUrlsResponseBody = await getUploadUrls(persistentId, itemInfo.size);
            } catch (err) { 
                new Notification({ title: itemInfo.name, body: err});
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
                itemInfo.storageUrls.push(uploadUrlsResponseBody.data.url);

                try {
                    uploadToStoreResponse = await uploadSinglepartToStore(event, itemInfo)
                } catch(err) {
                    new Notification({ title: itemInfo.name, body: err});
                    event.sender.send('actionFor' + itemInfo.id.toString(), 'fail', 0);
                    itemsFailed++;
                    continue;
                }
                const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));
                itemInfo.etag = responseHeaders.etag.replace(/^"+|"+$/g, ''); //Trim quotes from begin and end of etag

            } else if (uploadUrlsResponseBody.data.urls) {
                for (const key in uploadUrlsResponseBody.data.urls) {
                    itemInfo.storageUrls.push(uploadUrlsResponseBody.data.urls[key]);
                    try {
                        uploadToStoreResponse = await uploadMultipartToStore(event, itemInfo);
                    } catch (err) {
                        throw new Error("Error uploading part of file to store");
                    }
                    const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));
                    itemInfo.partEtags[Number(key)] = responseHeaders.etag.replace(/^"+|"+$/g, '');
                }

                const completeMultipartResponse: Electron.IncomingMessage = null;
                try {
                    await completeMultipartUpload(itemInfo, uploadUrlsResponseBody.data.complete);
                } catch (err) {
                    throw new Error("Error completing multipart uploading to store");
                }
                itemInfo.etag = await calcChecksum(itemInfo);
            }

            event.sender.send('actionFor' + itemInfo.id.toString(), 'success', 100);
            uploaded.push(itemInfo);

            //Step 2 for direct upload: Add file metadata after every 1000 files
            if (uploaded.length % 1000 == 0 || i + 1 == (numberOfItems - itemsFailed)) {
                const addMultipleFilesResponseBody: any = null;
                try {
                    await addMultipleFilesToDataset(persistentId, uploaded);
                } catch (err) {
                    throw new Error("Error adding files to dataset");
                }
                for (const item of uploaded) {
                    files.push(item);
                }
                uploaded = [];
            }
            i++;
        }

        return {
            numFiles2Upload: items.length,
            destination: persistentId,
            numFilesUploaded: files.length
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}