export class DatasetInfo {
    name: string;
    global_id: string;  

    constructor(name: string, global_id: string) {
        this.name = name;
        this.global_id = global_id;
    }
}