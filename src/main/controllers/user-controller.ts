import { Connection } from "../../models/connection";
import { DatasetInfo } from "../../models/dataset-info";
import { net } from "electron";

export const getApiUser = async (connection: Connection, callback: (last: string, first: string) => void): Promise<void> => {
    let msg = "";
    const apiCall = '/users/:me';

    const request = net.request({
        method: 'GET',
        url: connection.getUrl() + apiCall
    });

    request.on('response', (response) => {
        console.log('\n--- getCurrentUser ---\n');  // DEBUG
        console.log(`STATUS: ${response.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(response.headers, undefined, 2)}`);

        connection.setStatus(response.statusCode);
        response.on('data', (chunk) => {
            console.log("\nresponse.on chunk: " + chunk);
            const responseData = JSON.parse(chunk.toString());

            callback(responseData.data.lastName, responseData.data.firstName);
        });

    });
    request.on('finish', () => {
        msg = 'Request is Finished';
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('abort', () => {
        msg = 'Request is Aborted';
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('error', (error) => {
        msg = `ERROR: ${JSON.stringify(error)}`;
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('close', () => {
        msg = 'Last Transaction has occured';
        console.log(`\n${apiCall} ` + msg);
    });

    request.setHeader('Content-Type', 'application/json');
    request.setHeader('X-Dataverse-key', connection.getToken());
    request.end();
};

export const getUserDatasets = async (connection: Connection, author: string, datasetList: DatasetInfo[], callback: ( datasetList: DatasetInfo[]) => void): Promise<void> => {
    let msg = "";
    const apiCall = '/search?q=' + author;

    const request = net.request({
        method: 'GET',
        url: connection.getUrl() + apiCall
    });

    request.on('response', (response) => {
        console.log('\n--- getUserDatasets ---\n');  // DEBUG
        console.log(`STATUS: ${response.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(response.headers, undefined, 2)}`);

        response.on('data', (chunk) => {
            const responseData = JSON.parse(chunk.toString());

            responseData.data.items.forEach((item: {name:string, global_id:string}) => {
                datasetList.push(Object.assign({}, new DatasetInfo(item.name, item.global_id)));
                //addDataset(item.name, item.global_id);
            })
            console.log("\nresponse.on chunk: " + chunk);
            callback(datasetList);
        })
    });
    request.on('finish', () => {
        msg = 'Request is Finished';
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('abort', () => {
        msg = 'Request is Aborted';
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('error', (error) => {
        msg = `ERROR: ${JSON.stringify(error)}`;
        console.log(`\n${apiCall} ` + msg);
    });
    request.on('close', () => {
        msg = 'Last Transaction has occured';
        console.log(`\n${apiCall} ` + msg);
    });

    request.setHeader('Content-Type', 'application/json');
    request.setHeader('X-Dataverse-key', connection.getToken());
    request.end();
};