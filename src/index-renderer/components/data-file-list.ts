import { ipcRenderer } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../model/file-info.js";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
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

    ipcRenderer.on("DO_FILE_CLEAR", (event: Event, file: FileInfo) => {
      dataFiles.removeDataFile(file);
      this.selectedFiles.splice(file.id, 1);
      const element = document.getElementById(file.id.toString());
      element.remove();
      if (!dataFiles.length()) {
        (document.getElementById("clear") as HTMLButtonElement).disabled = true;
        (document.getElementById("upload") as HTMLButtonElement).disabled = true;
        (document.getElementById("cancel") as HTMLButtonElement).disabled = true;
      }
    });

    ipcRenderer.on("UPLOAD_DONE", (event: Event, result: Record<string, unknown>) => {
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
      (document.getElementById("cancel") as HTMLButtonElement).disabled = true;
      (document.getElementById("files") as HTMLButtonElement).disabled = false;
      (document.getElementById("folder") as HTMLButtonElement).disabled = false;
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

    ipcRenderer.on('DO_LIST_CLEAR', (event: Event)  => {
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

}