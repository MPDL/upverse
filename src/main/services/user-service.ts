import { Notification, net } from "electron";

import { DatasetInfo } from "../../models/dataset-info";
import { Settings } from "../settings";

const isDev = (process.env.isDev === 'true')

export const getApiUser = (): Promise<any> => {
    return new Promise<any>(
        (
            resolve: (values: any) => void,
            reject: (error: Error) => void
        ) => {
            try {
                let msg = "";
                const apiCall = '/users/:me';

                const request = net.request({
                    method: 'GET',
                    url: process.env.dv_base_uri + apiCall
                });

                request.on('response', (response) => {
                    Settings.settingsData.setStatus(response.statusCode)
                    if (response.statusCode === 200) {
                        response.on('data', (chunk) => {
                            const body = JSON.parse(chunk.toString());
                            resolve(body);
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
                new Notification({ title: "Error getting user: ", body: err });
            }
        })
};


export const getDatasetsPage = async (selectedPageNumber: number): Promise<any> => {
    return new Promise<any>(
        (
            resolve: (values: any) => void,
            reject: (error: Error) => void
        ) => {
            try {
                let msg = "";

                const params = new URLSearchParams([
                    ['key', `${process.env.admin_api_key}`],
                    ['role_ids', '1'],
                    ['role_ids', '3'],
                    ['role_ids', '5'],
                    ['role_ids', '6'],
                    ['role_ids', '7'],
                    ['dvobject_types', 'Dataset'],
                    ['published_states', 'Published'],
                    ['published_states', 'Unpublished'],
                    ['published_states', 'Draft'],
                    ['published_states', 'In+Review'],
                    ['selected_page', selectedPageNumber.toString()]
                ]).toString();
                //const apiCall = '/search?q=' + author + '&per_page=100';     
                const apiCall = `/mydata/retrieve`;

                const request = net.request({
                    method: 'GET',
                    url: process.env.dv_base_uri + apiCall + '?' + params
                });

                request.on('response', (response) => {
                    let data = "";

                    if (response.statusCode === 200) {
                        response.on('data', (chunk) => {
                            data += chunk.toString();
                        });
                        response.on('end', () => {
                            const body = JSON.parse(data.toString());
                            resolve(body);
                        });
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
        })
};