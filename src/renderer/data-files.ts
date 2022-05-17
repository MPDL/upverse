import { FileInfo } from '../models/file-info';

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
  
    addListener(listenerFn: Function) {
      this.listener = listenerFn;
    }
  
    addFile(selectedFile: File) {
      const newFile = new FileInfo (
        this.dataFiles.length,
        selectedFile.name,
        selectedFile.path,
        selectedFile.webkitRelativePath,
        selectedFile.size,
        selectedFile.type,
        new Date(selectedFile.lastModified)
      );
      this.dataFiles.push(newFile);
      this.listener(this.dataFiles.slice());
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
  }
  
  export const dataFiles = DataFiles.getInstance();