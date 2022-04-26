export class HttpException extends Error {
    public status: number;
    public message: string;
    public cause: string | string[];

    constructor(status: number, message: string, cause?: string | string[]) {
        super();
        this.status = status;
        this.message = message;
        this.cause = cause;
    }
}