import { net } from "electron";

import { User, Datasets } from "../interfaces/repository-interface";
import { DatasetInfo } from "../../model/dataset-info";

export const getMyUser = () => {
    return new Promise<User>(
        (
            resolve: (values: User) => void,
            reject: (error: Error) => void
        ) => {
            let msg = "";
            const apiCall = '/api/users/:me';

            const request = net.request({
                method: 'GET',
                url: process.env.dv_base_uri + apiCall
            });

            request.on('response', (response) => {
                if (response.statusCode === 200) {
                    response.on('data', (chunk) => {
                        const body = JSON.parse(chunk.toString());
                        resolve(body);
                    });
                } else if (response.statusCode === 401) {
                    reject(new Error('Invalid token!'));
                } else {
                    reject(new Error('Invalid URL!'));
                }
            });

            request.on('error', (error) => {
                reject(new Error('Invalid URL!'));
            });

            try {
                request.setHeader('Content-Type', 'application/json');
                request.setHeader('X-Dataverse-key', process.env.admin_api_key);
                request.end();
            } catch (err) {
                reject(err);
            }
        })
}

export const getMyDatasetsPage = (selectedPageNumber: number) => {
    return new Promise<Datasets>(
        (
            resolve: (values: Datasets) => void,
            reject: (error: Error) => void
        ) => {
            let msg = "";
            const params = new URLSearchParams([
                ['key', `${process.env.admin_api_key}`],
                ['role_ids', '1'],
                ['role_ids', '3'],
                ['role_ids', '5'],
                ['role_ids', '6'],
                ['role_ids', '7'],
                ['dvobject_types', 'Dataset'],
                ['published_states', 'Unpublished'],
                ['published_states', 'Published'],
                ['published_states', 'Draft'],
                ['published_states', 'In+Review'],
                ['selected_page', selectedPageNumber.toString()]
            ]).toString();  
            const apiCall = `/api/mydata/retrieve`;

            const request = net.request({
                method: 'GET',
                url: process.env.dv_base_uri + apiCall + '?' + params
            });

            request.on('response', (response) => {
                let data = "";

                if (response.statusCode === 200) {
                    response.on('data', (chunk) => {
                        data += chunk;
                    });
                    response.on('end', () => {
                        const body = JSON.parse(data.toString());
                        resolve(body);
                    });
                } else reject(new Error('No datasets found!'));
            });

            request.on('error', (error) => {
                reject(error);
            });

            try {
                request.setHeader('Content-Type', 'application/json');
                request.setHeader('X-Dataverse-key', process.env.admin_api_key);
                request.end();
            } catch (err) {
                reject(err);
            }
        })
}

export const getMyDatasetFilesCount = (id: string) => {
    return new Promise<DatasetInfo>(
        (
            resolve: (values: DatasetInfo) => void,
            reject: (error: Error) => void
        ) => {
            let msg = "";
            const apiCall = `/api/datasets/${id}/versions/:latest/files/counts`;
            const request = net.request({
                method: 'GET',
                url: process.env.dv_base_uri + apiCall
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
                } else reject(new Error('No file count of dataset found!'));
            });

            request.on('error', (error) => {
                reject(error);
            });

            try {
                request.setHeader('Content-Type', 'application/json');
                request.setHeader('X-Dataverse-key', process.env.admin_api_key);
                request.end();
            } catch (err) {
                reject(err);
            }
        })
}
