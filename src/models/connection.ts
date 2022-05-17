export class Connection {
    private url: string;
    private token: string;
    private status: number;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    setStatus(status: number): void {
        this.status = status;
    }

    setUrl(url: string) {
        this.url = url;
    }

    setToken(token: string) {
        this.token = token;
    }

    getStatus(): number {
        return this.status;
    }

    getUrl(): string {
        return this.url;
    }

    getToken(): string {
        return this.token;
    }

}