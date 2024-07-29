import { createReadStream } from 'fs';

import { FileInfo } from '../../model/file-info';
import { createHash } from 'crypto';
import { Transfer } from "../interfaces/storage-interface";
import log from 'electron-log/main';

import { IpcMainEvent, net } from "electron";

export const calcChecksum = (item: FileInfo): Promise<string> => {
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
            resolve(digest);
        })
    });
}

export const getUploadUrls = (doi: String, size: Number) => {
    return new Promise<Transfer>(
        (
            resolve: (values: Transfer) => void,
            reject: (error: Error) => void
        ) => {
            const params = new URLSearchParams([
                ['persistentId', `${doi}`],
                ['size', `${size}`]
            ]).toString();
            const apiCall = '/api/datasets/:persistentId/uploadurls';

            const options = {
                method: "GET",
                url: process.env.dv_base_uri + apiCall + '?' + params
            };
            const request = net.request(options);

            request.on('response', (response) => {
                let data = "";

                if (response.statusCode === 200) {
                    response.on('data', (chunk) => {
                        data += chunk;
                    });
                    response.on('end', () => {
                        resolve(JSON.parse(data.toString()));
                    });
                } else reject(new Error('Request for direct upload rejected'));
            });

            request.on('error', (error) => {
                log.error("getUploadUrls.request: \n" + error);
                reject(error);
            });

            request.setHeader('X-Dataverse-key', process.env.admin_api_key);
            request.end();
        });
}

export const uploadSinglepartToStore = (event: IpcMainEvent, item: FileInfo) => {
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
            request.setHeader('x-amz-tagging', 'dv-state=temp');

            let streamed = 0, uploaded = 0, pctStreamed = 0, pctUploaded = 0, prevPctStreamed = 0, prevPctUploaded = 0;

            let streamInterval: ReturnType<typeof setTimeout> = null; 
            let requestInterval: ReturnType<typeof setTimeout> = null;

            request.on('response', (response) => {
                clearInterval(requestInterval);
                item.uploaded = uploaded;
                resolve(response);
            });

            request.on('error', (error) => {
                log.error("uploadSinglepartToStore.request: \n" + error);
                reject(error);
            });

            fileStream.on('ready', () => {
                streamInterval = setInterval(() => {
                    pctStreamed = Math.round((streamed * 50) / item.size);
                    if (pctStreamed !== prevPctStreamed) {
                        event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed + pctUploaded);
                    }
                    prevPctStreamed = pctStreamed;
                }, 10);

                requestInterval = setInterval(() => {
                    if (request.getUploadProgress().started) {
                        uploaded = request.getUploadProgress().current;
                        pctUploaded = Math.round((uploaded * 50) / item.size);
                        if (pctUploaded > 0 && pctUploaded !== prevPctUploaded) {
                            event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed + pctUploaded);
                        }
                        prevPctUploaded = pctUploaded;
                    }
                }, 100);
            });

            fileStream.on("data", (data) => {
                request.write(data);
                streamed += data.length;
            });
            fileStream.on('close', () => {
                clearInterval(streamInterval);
                item.streamed = streamed;
            });
            fileStream.on("end", () => {
                request.end();
            });
            fileStream.on('error', (error) => {
                log.error("uploadSinglepartToStore.fileStream: \n" + error);
                reject(error);
            });
        });
}

export const addMultipleFilesToDataset = (doi: string, items: FileInfo[]) => {
    return new Promise<any>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
            let data = '';
            const params = new URLSearchParams([
                ['persistentId', `${doi}`]
            ]).toString();
            const apiCall = '/api/datasets/:persistentId/addFiles';

            const options = {
                method: 'POST',
                url: process.env.dv_base_uri + apiCall + '?' + params
            };
            const request = net.request(options);

            request.on('response', (response) => {
                resolve(response);
            });

            request.on('error', (error) => {
                log.error("addMultipleFilesToDataset.request: \n" + error);
                reject(error);
            });

            request.setHeader('X-Dataverse-key', process.env.admin_api_key);
            request.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');

            const json = [];
            for (const item of items) {
                json.push({
                    description: item.description, directoryLabel: item.relativePath,
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

export const uploadMultipartToStore = (event: IpcMainEvent, item: FileInfo) => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
            const partNumber: number = item.storageUrls.length;
            const url = item.storageUrls[partNumber - 1];
            const start = (partNumber - 1) * item.partSize;
            let end = (partNumber * item.partSize) - 1;
            if (item.size < end + 1) {
                end = item.size - 1;
            }
            const currentPartSize = end - start + 1;

            let streamed = item.streamed, uploaded = start;
            let pctStreamed = Math.round((item.streamed * 50) / item.size), pctUploaded = Math.round((item.uploaded * 50) / item.size), prevPctStreamed = pctStreamed, prevPctUploaded = pctUploaded;
 
            let streamInterval: ReturnType<typeof setTimeout> = null; 
            let requestInterval: ReturnType<typeof setTimeout> = null;

            const fileStream = createReadStream(item.path, { start: start, end: end, highWaterMark: 64 * 1024 * 1024 });

            const options = {
                method: 'PUT',
                url: url
            };
            const request = net.request(options);
            request.setHeader('x-amz-tagging', 'dv-state=temp');

            request.on('response', (response) => {
                clearInterval(requestInterval);
                item.uploaded += uploaded;
                resolve(response);
            })

            request.on('error', (error) => {
                log.error("uploadMultipartToStore.request: \n" + error);
                reject(error);
            });

            fileStream.on('ready', () => {
                streamInterval = setInterval(() => {
                    pctStreamed = Math.round((streamed * 50) / item.size);
                    if (pctStreamed > prevPctStreamed) {
                        event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed + pctUploaded);
                    }
                    prevPctStreamed = pctStreamed;
                }, 10);

                requestInterval = setInterval(() => {
                    if (request.getUploadProgress().started) {
                        uploaded = request.getUploadProgress().current + item.uploaded;
                        pctUploaded = Math.round((uploaded * 50) / item.size);
                        if (pctUploaded > prevPctUploaded) {
                            event.sender.send('actionFor' + item.id.toString(), 'progress', pctStreamed + pctUploaded);
                        }
                        prevPctUploaded = pctUploaded;
                    }
                }, 100);
            });

            fileStream.on('data', (data) => {
                request.write(data);
                streamed += data.length;
            });
            fileStream.on('close', () => {
                clearInterval(streamInterval);
                item.streamed += streamed;
            });
            fileStream.on('end', () => {
                request.end();
            });
            fileStream.on('error', (error) => {
                log.error("uploadMultipartToStore.fileStream: " + error);
                reject(new Error(`file streaming ${item.name} failed`));
            });
        });
}

export const completeMultipartUpload = (item: FileInfo, completeUrl: string) => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
            const options = {
                method: "PUT",
                url: process.env.dv_base_uri + completeUrl
            };
            const request = net.request(options);

            request.on('response', (response) => {
                resolve(response);
            });

            request.on('error', (error) => {
                log.error("completeMultipartUpload.request: \n" + error);
                reject(error);
            });

            request.setHeader('X-Dataverse-key', process.env.admin_api_key);
            var jsonpartEtags = JSON.stringify(Object.assign({}, item.partEtags));
            request.write(jsonpartEtags);
            request.end();
        });
}

export const abortMultipartUpload = (item: FileInfo, abortUrl: string) => {
    return new Promise<Electron.IncomingMessage>(
        (
            resolve: (values: Electron.IncomingMessage) => void,
            reject: (error: Error) => void
        ) => {
            const options = {
                method: "DELETE",
                url: process.env.dv_base_uri + abortUrl
            };
            const request = net.request(options);

            request.on('response', (response) => {
                resolve(response);
            });

            request.on('error', (error) => {
                log.error("abortMultipartUpload.request: \n" + error);
                reject(error);
            });

            request.setHeader('X-Dataverse-key', process.env.admin_api_key);
            request.end();
        });
}
