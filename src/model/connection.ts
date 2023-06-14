export class Connection {
    private url: string;
    private token: string;

    setUrl(url: string) {
        this.url = url;
    }

    setToken(token: string) {
        this.token = token;
    }

    getUrl(): string {
        return this.url;
    }

    getToken(): string {
        return this.token;
    }
}