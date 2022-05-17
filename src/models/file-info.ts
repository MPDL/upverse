export class FileInfo {
  constructor (
    public id: number,
    public name: string,
    public path: string,
    public relativePath: string,
    public size: number,
    public type: string,
    public lastModifiedDate?: Date,
    public description?: string,
    public storage_url?: string, 
    public storage_id?: string,
    public part_size?: number,
    public etag?: string,
    public etags?: string[],
    public final_result?: number) {}
}
