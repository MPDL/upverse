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
    public storageUrls?: string[],
    public storageId?: string,
    public partSize?: number,
    public etag?: string,
    public partEtags?: string[],
    public streamed?: number,
    public uploaded?: number) {}
}
