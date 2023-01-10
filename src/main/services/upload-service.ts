import { createReadStream } from 'fs';

import { FileInfo } from '../../models/file-info';
import { createHash } from 'crypto';

import { IpcMainEvent, Notification, net } from "electron";

const isDev = true; //true; //process.env.isDev as string;
let event: IpcMainEvent = null;

export const calcChecksum = async (item: FileInfo): Promise<string> => {    
    return new Promise((resolve, reject) => {
        const hash = createHash('md5');
        const stream = createReadStream(item.path);

        stream.on('error', function (error) {
            reject(error);
        })

        stream.on('data', function (data) {
            hash.update(data as string, 'utf8')
        })

        stream.on('end', function () {
            stream.close();
            const digest = hash.digest('hex');
            if (isDev) console.log("\nSuccessfully calculated checksum for " + item.path + ": " + digest);
            resolve(digest);
        })
    });
}

export const getUploadUrls = (doi: String, size: Number): Promise<any> => {
    return new Promise<any>(
        (
            resolve: (values: any) => void, 
            reject: (error: Error) => void
        ) => {

        const apiCall = '/datasets/:persistentId/uploadurls?persistentId=' + doi + '&size=' + size;

        const options = {
            method: "GET",
            url: process.env.dv_base_uri + apiCall
        };
        const request = net.request(options);

        if (isDev) console.log("\n> > >\n");
        let msg = 'Request is Started';
        if (isDev) console.log(`\n${new Date()}${options.method} ${options.url} ${msg}`);

        request.on('response', (response) => {
            if (response.statusCode === 200) {
                response.on('data', (chunk) => {
                    const body = JSON.parse(chunk.toString());
                    resolve(body);
                });
            } else reject(new Error('Request Rejected'));
        });

        request.on('finish', () => {
            msg = 'Request is Finished';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            reject(new Error(msg));
        });
        request.on('close', () => {
            msg = 'Last Transaction is closed';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            if (isDev) console.log("\n< < <\n");
        });

        request.setHeader('X-Dataverse-key', process.env.admin_api_key);
        request.end();
    });
}

export const uploadSinglepartToStore = (event: IpcMainEvent, item: FileInfo): Promise<Electron.IncomingMessage> => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {

        const fileStream = createReadStream(item.path, { highWaterMark: 64 * 1024 * 1024 });

        const options = {
            method: 'PUT',
            url: item.storageUrls[0]
        };
        const request = net.request(options);

        if (isDev) console.log("\n> > >\n");
        let msg = 'Request is Started';
        if (isDev) console.log(`\n${new Date()}${options.method} ${options.url} ${msg}`);

        request.setHeader('x-amz-tagging', 'dv-state=temp');

        let streamed = 0, pctStreamed = 0, pctUploaded = 0, prevPctStreamed = 0, prevPctUploaded = 0;
        let streamInterval:NodeJS.Timer, requestInterval:NodeJS.Timer = null;

        request.on('response', (response) => {         
            clearInterval(requestInterval);
            resolve(response);
        });

        request.on('finish', () => {
            msg = 'Request is Finished';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
           reject(new Error(msg));
        });
        request.on('close', () => {
            msg = 'Last Transaction is closed';
            if (isDev) console.log(`\n${options.method} ${options.url} ${msg}`);
            if (isDev) console.log("\n< < <\n");
        });

        fileStream.on('ready', () => {        
            streamInterval = setInterval(() => {
                pctStreamed = Math.round((streamed * 50) / item.size );
                if (pctStreamed !== prevPctStreamed) { 
                    if (isDev) console.log("Streamed ", pctStreamed * 2, new Date().toUTCString() )
                    event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed);
                }
                prevPctStreamed = pctStreamed; 
                item.streamed = streamed;
            }, 100 );
            
            requestInterval = setInterval(() => {
                if (request.getUploadProgress().started) {
                    item.uploaded = request.getUploadProgress().current;
                    pctUploaded = Math.round((item.uploaded * 50) / item.size);
                    if (item.uploaded > 0 && pctUploaded !== prevPctUploaded) {
                        if (isDev) console.log("Uploaded ", pctUploaded * 2, new Date().toUTCString())
                        event.sender.send('actionFor'+item.id.toString(), 'progress', pctStreamed + pctUploaded);
                    }
                    prevPctUploaded = pctUploaded;
                }
            }, 10 );
        });

        fileStream.on("data", (data) => {
            request.write(data);
            streamed += data.length;
        });
        fileStream.on('close', () => {
            if (isDev) console.log(`file streaming for ${item.name} closed`);
            clearInterval(streamInterval);
        });
        fileStream.on("end", () => {
            if (isDev) console.log(`file streaming ${item.name} finished`);
            request.end();
        });
        fileStream.on('error', (error) => {
            msg = `ERROR on ${item.name}: ${error}`;
            if (isDev) console.log(`\n${msg}\n`);
            reject(new Error(`file streaming ${item.name} failed`));
        });

    });
}

export const addMultipleFilesToDataset = (doi: string, items: FileInfo[]): Promise<any> => {
    return new Promise<any>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
        const apiCall = '/datasets/:persistentId/addFiles?persistentId=';

        const options = {
            method: 'POST',
            url: process.env.dv_base_uri + apiCall + doi
        };
        const request = net.request(options);

        if (isDev) console.log("\n> > >\n");
        let msg = 'Request is Started';
        if (isDev) console.log(`\n${new Date()}${options.method} ${options.url} ${msg}`);

        request.on('response', (response) => {
            response.on('data', (chunk) => {
                const body = JSON.parse(chunk.toString());
                resolve(body);
            })
        });
        request.on('finish', () => {
            msg = 'Request is Finished';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            reject(new Error(msg));
        });
        request.on('close', () => {
            msg = 'Last Transaction is closed';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });

        request.setHeader('X-Dataverse-key', process.env.admin_api_key);
        request.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
        
        const json = [];
        for (const item of items) {
            json.push({
                description: item.description, directoryLabel: item.relativePath.replace(item.name,''),
                storageIdentifier: item.storageId, fileName: item.name, mimeType: item.type, md5Hash: item.etag
            })
        }

        let postData = '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"jsonData\"\r\n\r\n' + 
            JSON.stringify(json) +
             '\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--';
        request.write(postData);        
        request.end();

    });
}

export const uploadMultipartToStore = (event: IpcMainEvent, item: FileInfo): Promise<Electron.IncomingMessage> => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
            let streamed = item.streamed, uploaded = item.uploaded;
            let pctStreamed = item.streamed * 50 / item.size, pctUploaded = item.uploaded * 50 / item.size, prevPctStreamed = 0, prevPctUploaded = 0;
            let streamInterval:NodeJS.Timer, requestInterval:NodeJS.Timer = null;
        
            const partNumber: number = item.storageUrls.length;
            const url = item.storageUrls[partNumber - 1];
            const start = (partNumber - 1) * item.partSize;
            let end = (partNumber * item.partSize) - 1;
            if (item.size < end + 1) {
                end = item.size - 1;
            }
            const currentPartSize = end - start + 1;
        
            const fileStream = createReadStream(item.path, { start: start, end: end,highWaterMark: 64 * 1024 * 1024 });

            const options = {
                method: 'PUT',
                url: url
            };
            const request = net.request(options);

            if (isDev) console.log("\n> > >\n");
            let msg = 'Request is Started';
            if (isDev) console.log(`\n${new Date()}${options.method} ${options.url} ${msg}`);

            request.setHeader('x-amz-tagging', 'dv-state=temp');
            
            request.on('response', (response) => {          
                clearInterval(requestInterval);
                item.uploaded += uploaded;
                resolve(response);
            })

            request.on('finish', () => {
                msg = 'Request is Finished';
                 if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);         
            });
            request.on('abort', () => {
                msg = 'Request is Aborted';
                 if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            });
            request.on('error', (error) => {
                msg = `ERROR: ${error}`;
                 if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
                 reject(new Error(msg));
            });
            request.on('close', () => {
                msg = 'Last Transaction is closed';
                 if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            });

            fileStream.on('ready', () => {        
                streamInterval = setInterval(() => {
                    pctStreamed = Math.round((streamed * 50) / item.size );
                    if (pctStreamed !== prevPctStreamed) { 
                        if (isDev) console.log("Streamed ", pctStreamed * 2, new Date().toUTCString() )
                        event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed + pctUploaded);
                    }
                    prevPctStreamed = pctStreamed;
                }, 100 );
                
                requestInterval = setInterval(() => {
                    if (request.getUploadProgress().started) {
                        uploaded = request.getUploadProgress().current + item.uploaded;
                        pctUploaded = Math.round((uploaded  * 50) / item.size);
                        if (pctUploaded > 0 && pctUploaded !== prevPctUploaded) {
                            if (isDev) console.log("Uploaded ", pctUploaded * 2, new Date().toUTCString())
                            event.sender.send('actionFor'+item.id.toString(), 'progress', pctStreamed + pctUploaded);
                        }
                        prevPctUploaded = pctUploaded;
                    }
                }, 10 );
            });

            fileStream.on('data', (data) => {
                request.write(data);
                streamed += data.length;
            });
            fileStream.on('close', () => {
                if (isDev) console.log(`file streaming for ${item.name} closed`);
                clearInterval(streamInterval);
                item.streamed += streamed;
            });
            fileStream.on('end', () => {
                if (isDev) console.log(`file streaming ${item.name} finished`);
                request.end();
            });
            fileStream.on('error', (error) => {
                msg = `ERROR on ${item.name}: ${error}`;
                if (isDev) console.log(`\n${msg}\n`);
                reject(new Error(`file streaming ${item.name} failed`));
            });

    });
}

export const completeMultipartUpload = async (item: FileInfo, completeUrl: string): Promise<Electron.IncomingMessage> => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
        const options = {
            method: "PUT",
            url: process.env.dv_base_uri.substring(0, process.env.dv_base_uri.indexOf('/api')) + completeUrl
        };
        const request = net.request(options);

        if (isDev) console.log("\n> > >\n");
        let msg = 'Request is Started';
        if (isDev) console.log(`\n${new Date()}${options.method} ${options.url} ${msg}`);

        request.on('response', (response) => {
            resolve(response);
        });
        request.on('finish', () => {
            msg = 'Request is Finished';
             if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
             if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
             if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
            reject(new Error(msg));
        });
        request.on('close', () => {
            msg = 'Last Transaction is closed';
             if (isDev) console.log(`\n${new Date()}${options.method} ${options.url}\n${msg}`);
        });

        request.setHeader('X-Dataverse-key', process.env.admin_api_key);
        var jsonpartEtags = JSON.stringify(Object.assign({}, item.partEtags));
        request.write(jsonpartEtags);
        request.end();

    });
}        
