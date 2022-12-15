import { calcChecksum, getUploadUrls, uploadSinglepartToStore, uploadMultipartToStore, completeMultipartUpload, addMultipleFilesToDataset  } from '../controllers/upload-controller';

import { FileInfo } from '../../models/file-info';
import { IpcMainEvent } from "electron";

const isDev = true; //true; //process.env.isDev as string;

export const transfer_direct_from_file = async (event: IpcMainEvent, persistentId: string, items: FileInfo[]): Promise<Record<string, unknown>> => {
    try {
        //const items = [];
        const files = [];
        let uploaded = [];
        const numberOfItems = items.length;
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
                description: item.description
            };
       
            if (isDev) console.log('Attempting to upload ' + itemInfo.name + ' as ' + itemInfo.type + ' from ' + itemInfo.relativePath + ' at ' + Date());
            event.sender.send('actionFor' + itemInfo.id.toString(),'start',0);

            //Step 1 for direct upload: Upload files to object storage
            let uploadUrlsResponseBody = await getUploadUrls(persistentId, itemInfo.size);
 
            itemInfo.storageId = uploadUrlsResponseBody.data.storageIdentifier;
            itemInfo.partSize = uploadUrlsResponseBody.data.partSize
            itemInfo.storageUrls = [];
            itemInfo.partEtags = [];

            let uploadToStoreResponse: Electron.IncomingMessage = null;
            if (uploadUrlsResponseBody.data.url) {
                itemInfo.storageUrls.push(uploadUrlsResponseBody.data.url);
            
                uploadToStoreResponse = await uploadSinglepartToStore(event, itemInfo);
                if (uploadToStoreResponse.statusCode !== 200) throw new Error("Error uploading file to store");

                const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));      
                itemInfo.etag = responseHeaders.etag.replace(/^"+|"+$/g, ''); //Trim quotes from begin and end of etag

            } else if (uploadUrlsResponseBody.data.urls) {
                for (const key in uploadUrlsResponseBody.data.urls) {
                    itemInfo.storageUrls.push(uploadUrlsResponseBody.data.urls[key]);
                    uploadToStoreResponse = await uploadMultipartToStore(event, itemInfo);
                    if (uploadToStoreResponse.statusCode !== 200) throw new Error("Error uploading part of file to store");
 
                    const responseHeaders = JSON.parse(JSON.stringify(uploadToStoreResponse.headers));
                    itemInfo.partEtags[Number(key)] = responseHeaders.etag.replace(/^"+|"+$/g, '');
                }

                const completeMultipartResponse = await completeMultipartUpload(itemInfo, uploadUrlsResponseBody.data.complete);
                if (completeMultipartResponse.statusCode !== 200) throw new Error("Error completing multipart uploading to store: ");
                itemInfo.etag = await calcChecksum(itemInfo);
            }

            event.sender.send('actionFor' + itemInfo.id.toString(),'success',100);
            uploaded.push(itemInfo);

            //Step 2 for direct upload: Add file metadata after every 1000 files
            if (uploaded.length % 1000 == 0 || i + 1 == numberOfItems) {
                const addMultipleFilesResponseBody = await addMultipleFilesToDataset(persistentId, uploaded);
                for (const item of uploaded) {
                    files.push(item);
                }
                uploaded = [];
            }
            i++;
        }

        return {
            number_of_files: items.length,
            destination: persistentId,
            files: files.length
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}