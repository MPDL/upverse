import { JsonData } from './../../model/json-data';
import { ipcRenderer, IpcRendererEvent, shell } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../model/file-info.js";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  openDatasetElement: HTMLLinkElement;

  selectedFiles: FileInfo[];

  constructor() {
    super("data-file-list", "app-file-list", true, "file2upload-list");
    this.fileListElement = this.element.querySelector(
      "#research-files-list"
    ) as HTMLUListElement;
    
    this.selectedFiles = [];

    this.configure();
  }

  configure(): void {
    ipcRenderer.setMaxListeners(0);

    dataFiles.updateListener((file: FileInfo) => {
      this.selectedFiles.push(file);
      this.renderItem(this.selectedFiles[this.selectedFiles.length - 1]); 
    });

    ipcRenderer.on("DO_FILE_CLEAR", (event: IpcRendererEvent, file: FileInfo) => {
      dataFiles.removeDataFile(file);
      this.selectedFiles.splice(file.id, 1);
      const element = document.getElementById(file.id.toString());
      element.remove();
      if (dataFiles.length() === 0) {
        (document.querySelector(
          '#clear'
        ) as HTMLButtonElement).disabled = true;
        (document.querySelector(
          '#upload'
        ) as HTMLButtonElement).disabled = true;  
        ipcRenderer.send('DO_CLEAR_SELECTED');
      }
    });

    ipcRenderer.on("UPLOAD_DONE", (event: IpcRendererEvent, result: Record<string, unknown>, repository: string) => {
      this.selectedFiles = [];
      dataFiles.clear(); 
      
      this.element.querySelector(
        "ul"
      )!.innerHTML = this.successReport(result, repository);
      this.openDatasetElement = document.getElementById(
        'open-dataset'
      ) as HTMLLinkElement;
      this.openDatasetElement.addEventListener('click', this.openDatasetHandler.bind(this)); 
    });

    ipcRenderer.on("UPLOAD_FAILED", (event: IpcRendererEvent, result: Record<string, unknown>, repository: string) => {
      this.selectedFiles = [];
      dataFiles.clear(); 

      this.element.querySelector(
        "ul"
      )!.innerHTML = this.failReport(result);
    });

    ipcRenderer.on("abort", (event: IpcRendererEvent, result: Record<string, unknown>) => {
      this.selectedFiles = [];
      dataFiles.clear();
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-failed">
        <h5>Selected files couldn't be uploaded!</h5>
       </div>`;  
    });

    ipcRenderer.on('DO_LIST_CLEAR', (event: IpcRendererEvent)  => {
      this.selectedFiles = [];
      dataFiles.clear();
      this.clearItemList();
    })
  }
  
  private renderItem(fileInfo: FileInfo) {
      new FileItem(this.element.querySelector("ul")!.id, fileInfo);
  }

  private clearItemList() {
    this.fileListElement.innerHTML = '';
  }

  private openDatasetHandler(event: Event) {
    event.preventDefault();

    shell.openExternal(this.openDatasetElement.href); 
  }

  private successReport(result: any, repository: any): string {

    return `<div id="upload-done">
        <h5>Upload report</h5>
        <h5>${result.numFiles2Upload}<i> files to upload, </i>${(result.numFiles2Upload as number) - (result.numFilesUploaded as number)} fails</h5>
        <h5>${result.numFilesUploaded}<i> files uploaded to </i>${result.destination}</h5>
        <br>
        <a id="open-dataset" href="${repository}/dataset.xhtml?persistentId=${result.destination}&version=DRAFT" target="_blank"><button class="btn btn-secondary"><i class="bi bi-card-checklist"></i> Open your dataset page on browser </button></a>
      </div>`;
  }

  private failReport(result: any): string {

    return `<div id="upload-failed">
        <h5>Upload failed!</h5>
        <p>${result}</p>
      </div>`;
  }

}