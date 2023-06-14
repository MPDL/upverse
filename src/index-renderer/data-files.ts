import { FileInfo } from '../model/file-info';

export class DataFiles {
  private listener: any = null;
  private dataFiles: FileInfo[] = [];
  private static instance: DataFiles;

  private constructor() {

  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new DataFiles();
    return this.instance;
  }

  updateListener(listenerFn: Function) {
    this.listener = listenerFn;
  }

  addFile(selectedFile: FileInfo) { 
    this.dataFiles.push(selectedFile);
    this.listener(this.dataFiles[this.dataFiles.length - 1]);
  }

  removeDataFile(file: FileInfo) {
    const position = this.dataFiles.findIndex(element => element.id === file.id);
    this.dataFiles.splice(position, 1);
  }

  updateDataFile(file: FileInfo) {
    if (file.id < this.dataFiles.length) {
      this.dataFiles[file.id].description = file.description;
    }
  }

  getAll(): FileInfo[] {
    return this.dataFiles;
  }

  clear(): void {
    this.dataFiles = [];
  }

  length(): number {
    return this.dataFiles.length;
  }
}

export const dataFiles = DataFiles.getInstance();