export class UserInfo {
    private lastName: string;
    private firstName: string; 
    
    constructor(last: string, first: string) {
        this.lastName = last;
        this.firstName = first;
    }

    getAuthor(): string {
        return this.lastName + ', ' + this.firstName;
    }
}