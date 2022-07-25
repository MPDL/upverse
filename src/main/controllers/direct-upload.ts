import { ReadStream, createReadStream, statSync } from 'fs';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { FileInfo } from '../../models/file-info';
import FormData from 'form-data';
import { axios_error_handler } from '../base/service/error.handler';
import { createHash } from 'crypto';
import { request } from '../base/service/http.service';

const calculateChecksum = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const hash = createHash('md5');
        const stream = createReadStream(filePath);

        stream.on('error', function (err) {
            reject(err);
        })

        stream.on('data', function (data) {
            hash.update(data as string, 'utf8')
        })

        stream.on('end', function () {
            stream.close();
            const digest = hash.digest('hex');
            console.log("\nSuccessfully calculated checksum for " + filePath + ": " + digest);
            resolve(digest);
        })
    });
}

const getUploadUrls = async (doi: string, size: number) => {
    const params = {
        persistentId: doi,
        size: size
    }
    try {
        const response = await request('get', '/datasets/:persistentId/uploadurls', params, process.env.admin_api_key, null);
        if (response && (response.data as any).data) { // eslint-disable-line
            const data = (response.data as any); // eslint-disable-line
            return data;
            /*
            item.url = data.url;
            item.part_size = data.partSize;
            item.storage_id = data.storageIdentifier;
            return item;
            */
        }
        return null;
    } catch (e) {
        axios_error_handler(e);
        throw e;
    }
}

export const directUpload = async (doi: string, item: FileInfo): Promise<FileInfo> => {
    try {

        console.log("\nDirect Upload - Processing file " + item.path)
        const uploadUrlResponse = await getUploadUrls(doi, item.size);
        item.part_size = uploadUrlResponse.data.partSize;
        item.storage_id = uploadUrlResponse.data.storageIdentifier;
        item.etags = [];
        item.size = statSync(item.path).size;

        if (uploadUrlResponse.data.url) {
            const fileStream = createReadStream(item.path);

            console.log("\nDirect Upload\n - One URL found: " + uploadUrlResponse.data.url)
            console.log("\nStarting Direct Upload for one part");
            const resp = await directUploadPart(uploadUrlResponse.data.url, fileStream, item.size);
            item.etags[1] = resp.headers.etag;
            //Trim quotes from begin and end of etag
            item.etag = resp.headers.etag.replace(/^"+|"+$/g, '');

        }
        else if (uploadUrlResponse.data.urls) {
            console.log("\nDirect Upload - Multiple URLs found");
            const checksum = calculateChecksum(item.relativePath.replace(item.name,''));
            for (const key in uploadUrlResponse.data.urls) {
                const partNumber: number = +key;
                const url = uploadUrlResponse.data.urls[key];
                const start = (partNumber - 1) * item.part_size;
                let end = (partNumber * item.part_size) - 1;
                if (item.size < end + 1) {
                    end = item.size - 1;
                }
                const currentPartSize = end - start + 1;
                const file_stream = createReadStream(item.path, { start: start, end: end });
                console.log("\nStarting Direct Upload - Part: " + partNumber + " from byte " + start + " to byte " + end);
                const resp = await directUploadPart(url, file_stream, currentPartSize);
                item.etags[partNumber] = resp.headers.etag;
            }
            await finishPartUpload(uploadUrlResponse.data.complete, item.etags);
            item.etag = await checksum;
        }

        return item;
    }
    catch (error) {
        axios_error_handler(error);
        throw error;
    }
}

const directUploadPart = async (url: string, fileStream: ReadStream, size: number) => {
    try {
        const cfg: AxiosRequestConfig = {
            url: url,//.replace('https', 'http'),
            method: 'PUT',
            headers: {
                'Content-Length': size as unknown as string,
                //'Content-Type': item.type,
                'x-amz-tagging': 'dv-state=temp',
            },
            // ridiculously enough axios has a max. content length of 10M by default
            // maxContentLength & maxBodyLength have to be set independently ...
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            data: fileStream,            
            onUploadProgress: (progressEvent: ProgressEvent) => {
                //var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log("\nProgress: " + progressEvent);
            }
        }
        const resp = await axios(cfg);
        console.log("\nEnding Direct Upload for one part");
        return resp;
    } catch (error) {
        axios_error_handler(error);
        throw error;
    }

}

const finishPartUpload = async (completeUrl: string, etags: string[]) => {

    try {
        /*
        const json = {};
        for(const part_number in etags) {
            json[part_number] = etags[part_number];
        }
        */

        const cfg: AxiosRequestConfig = {
            //Strip /api from base uri, as its already part of completeUrl
            url: process.env.dv_base_uri.substring(0, process.env.dv_base_uri.indexOf('/api')) + completeUrl,
            method: 'PUT',
            headers: {
                'X-Dataverse-key': process.env.admin_api_key
            },
            // ridiculously enough axios has a max. content length of 10M by default
            // maxContentLength & maxBodyLength have to be set independently ...
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            data: JSON.stringify(etags)
        }

        return await axios(cfg);
    }
    catch (error) {
        axios_error_handler(error);
        throw error;
    }

}


export const addDirectUploadFiles = async (doi: string, items: FileInfo[]): Promise<AxiosResponse> => {
    console.log("\nAdding " + items.length + " files to dataset " + doi);
    const form = new FormData();
    const json = [];
    for (const item of items) {
        json.push({
            description: item.description, directoryLabel: item.relativePath.replace(item.name,''),
            storageIdentifier: item.storage_id, fileName: item.name, mimeType: item.type, md5Hash: item.etag
        })
    }
    form.append('jsonData', JSON.stringify(json));
    const heads = form.getHeaders();
    const cfg: AxiosRequestConfig = {
        url: process.env.dv_base_uri + '/datasets/:persistentId/addFiles',
        method: 'POST',
        params: {
            persistentId: doi
        },
        headers: {
            ...heads,
            'X-Dataverse-key': process.env.admin_api_key
        },
        data: form
    };
    try {
        const resp = await axios(cfg);
        return resp;
    } catch (error) {
        axios_error_handler(error);
        throw error;
    }
}
