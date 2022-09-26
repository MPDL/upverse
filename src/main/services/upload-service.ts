import { addDirectUploadFiles, directUpload } from '../controllers/direct-upload';

import { FileInfo } from '../../models/file-info';
import { IpcMainEvent } from "electron";
import { axios_error_handler } from '../base/service/error.handler';

export const transfer_direct_from_file = async (event: IpcMainEvent, persistentId: string, items: FileInfo[]): Promise<Record<string, unknown>> => {
    try {
        //const items = [];
        const files = [];
        let uploaded = [];
        const numberOfItems = items.length;
        let i = 0;

        for (const item of items) {
            const item_info: FileInfo = {
                id: item.id,
                name: item.name,
                size: item.size,
                type: item.type,
                lastModifiedDate: new Date(item.lastModifiedDate),
                path: item.path,
                relativePath: item.relativePath,
                description: item.description
            };
       
            console.log('attempting to upload ' + item_info.name + ' from ' + item_info.relativePath);

            event.sender.send('actionFor'+item_info.id.toString(),'start');
            //Step 1 for direct upload: Upload files to object storage
            await directUpload(persistentId, item_info);
            event.sender.send('actionFor'+item_info.id.toString(),'success');
            uploaded.push(item_info);


            //Step 2 for direct upload: Add file metadata after every 1000 files
            if (uploaded.length % 1000 == 0 || i + 1 == numberOfItems) {
                await addDirectUploadFiles(persistentId, uploaded);

                for (const item of uploaded) {
                    //Make that async to speed up next upload
                    //await addToDatabase(item, set.id, set.latestVersion.id, userId);
                    //const dates = await update_dates_4_file_by_storage_id(item);
                    //logger.info('updated dates 4 ' + item.name + ' (' + dates + ')');
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
        axios_error_handler(err);
        throw err;
    }
}