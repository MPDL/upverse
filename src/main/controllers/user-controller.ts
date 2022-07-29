import { Notification, net } from "electron";

import { DatasetInfo } from "../../models/dataset-info";
import { Settings } from "../settings";

const isDev = (process.env.isDev === 'true')

export const getApiUser = async (callback: (last: string, first: string) => void): Promise<void> => {
    try {
        let msg = "";
        const apiCall = '/users/:me';

        const request = net.request({
            method: 'GET',
            url: process.env.dv_base_uri + apiCall
        });

        request.on('response', (response) => {
            Settings.settingsData.setStatus(response.statusCode)
            if(response.statusCode === 200) {
                response.on('data', (chunk) => {
                    const responseData = JSON.parse(chunk.toString());

                    callback(responseData.data.lastName, responseData.data.firstName);
                });
            } else if (response.statusCode === 400) {
                new Notification({ title: 'Connect', body: 'Invalid token!' }).show();
            } else new Notification({ title: 'Connect', body: 'Invalid URL!' }).show();
        });
        request.on('finish', () => {
            msg = 'Request is Finished';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('close', () => {
            msg = 'Last Transaction has occured';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });

        request.setHeader('Content-Type', 'application/json');
        request.setHeader('X-Dataverse-key', process.env.admin_api_key);
        request.end();

    } catch (err) {
        new Notification({title: "Error getting user: ", body: err});
    }
};

export const getUserDatasets = async (author: string, datasetList: DatasetInfo[], callback: ( datasetList: DatasetInfo[]) => void): Promise<void> => {
    try {
        let msg = "";
        const apiCall = '/search?q=' + author + '&per_page=100';

        const request = net.request({
            method: 'GET',
            url: process.env.dv_base_uri + apiCall
        });

        request.on('response', (response) => {
            if(response.statusCode === 200) {
                response.on('data', (chunk) => {
                    const responseData = JSON.parse(chunk.toString());

                    responseData.data.items.forEach((item: {name:string, global_id:string}) => {
                        datasetList.push(Object.assign({}, new DatasetInfo(item.name, item.global_id)));
                        console.log("datasetList.length: " + datasetList.length);
                    })
                    callback(datasetList);
                })
            } else new Notification({ title: 'Connect', body: 'No datasets found!' }).show();
        });
        request.on('finish', () => {
            msg = 'Request is Finished';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('abort', () => {
            msg = 'Request is Aborted';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('error', (error) => {
            msg = `ERROR: ${JSON.stringify(error)}`;
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });
        request.on('close', () => {
            msg = 'Last Transaction has occured';
            if (isDev) console.log(`\n${apiCall} ` + msg);
        });

        request.setHeader('Content-Type', 'application/json');
        request.setHeader('X-Dataverse-key', process.env.admin_api_key);
        request.end();
    } catch (err) {
        new Notification({ title: 'Connect', body: 'Error getting datasets!' }).show();
    }
};