import { ipcRenderer, shell } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  selectedFiles: FileInfo[];

  constructor() {
    super("data-file-list", "app-file-list", true, "file2upload-list");
    this.fileListElement = this.element.querySelector(
      "#file-list"
    ) as HTMLUListElement;
    
    this.selectedFiles = [];

    this.configure();
    this.renderHeader();
  }

  configure(): void {
    ipcRenderer.setMaxListeners(0);

    dataFiles.updateListener((file: FileInfo) => {
      this.selectedFiles.push(file);
      this.renderItem(this.selectedFiles[this.selectedFiles.length - 1]); 
    });

    ipcRenderer.on("removeItem", (event: Event, file: FileInfo) => {
      dataFiles.removeDataFile(file);
      this.selectedFiles.splice(file.id, 1);
      const element = document.getElementById(file.id.toString());
      element.remove();
    });

    ipcRenderer.on("end", (event: Event, result: Record<string, unknown>) => {
      this.selectedFiles = [];
      dataFiles.clear(); 
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-done">
        <h5>${result.numFiles2Upload}<i> files to upload, </i>${(result.numFiles2Upload as number) - (result.numFilesUploaded as number)} fails</h5>
        <h5>${result.numFilesUploaded}<i> files uploaded to </i>${result.destination}</h5>
        <br>
        <a href="http://edmond.mpdl.mpg.de" target="_blank"><button class="btn btn-secondary"><i class="bi bi-card-checklist"></i> Open Edmond</button></a>
        </div>`;  
      //  <button id="appserver" class="btn btn-secondary" type="submit"><i class="bi bi-card-checklist"></i> Open Edmond</button>
      // this.element.querySelector("#appserver")!.addEventListener('click', this.clickHandler.bind(this));
    });

    ipcRenderer.on("abort", (event: Event, result: Record<string, unknown>) => {
      this.selectedFiles = [];
      dataFiles.clear();
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-failed">
        <h5>Selected files couldn't be uploaded!</h5>
       </div>`;  
    });

    ipcRenderer.on('selectFiles', (event: Event, folder: string)  => {
      console.log('selectFiles');
      this.element.querySelector(
        "ul"
      )!.innerHTML = '';
    })

    ipcRenderer.on('clearFiles', (event: Event)  => {
      console.log('clearFiles');
      this.selectedFiles = [];
      dataFiles.clear();
      this.element.querySelector(
        "ul"
      )!.innerHTML = '';
    })
  }

  private async clickHandler(event: Event) {
    await shell.openExternal(process.env.dv_base_uri.replace('/api','')).then(() => {console.log("Done")}).catch((error) => {console.log(error.toString())});
  }

  private renderHeader(): void {
    const listId = "research-files-list";
    this.element.querySelector("ul")!.id = listId;
  }

  private renderItem(fileInfo: FileInfo) {
    new FileItem(this.element.querySelector("ul")!.id, fileInfo);
  }

}