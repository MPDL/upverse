export interface Transfer {
    status: string;
    data:   TransferSettings;
}

export interface TransferSettings {
    url?:               string;
    urls?:              { [key: string]: string };
    abort:             string;
    complete:          string;
    partSize:          number;
    storageIdentifier: string;
}
