import axios, { AxiosRequestConfig, Method } from 'axios';

const request_headers = (api_key: string) => {
    return {
        'Content-Type': 'application/json',
        'X-Dataverse-key': api_key
        }
};

/* eslint-disable */
export const request = (method: Method, ctx_path: string, params: Record<string, unknown>, api_key: string, data: any) => {
    const base_uri = process.env.dv_base_uri as string;
    const cfg: AxiosRequestConfig = {
        url: base_uri.concat(ctx_path),
        method,
        params,
        headers: request_headers(api_key),
        data
    }
    return axios(cfg);
};
