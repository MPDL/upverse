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
    ipcRenderer.setMaxListeners(65000);

    dataFiles.addListener((files: FileInfo[]) => {
      this.selectedFiles = files;
      this.renderItems(); 
    });

    ipcRenderer.on("removeItem", (event: Event, file: FileInfo) => {
      dataFiles.removeDataFile(file);
    });

    ipcRenderer.on("end", (event: Event, result: Record<string, unknown>) => {
      dataFiles.clear(); 
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-done">
        <h5>${result.files}<i> files uploaded to </i>${result.destination}</h5>
        <br>
        <button id="appserver" class="btn btn-secondary" type="submit"><i class="bi bi-card-checklist"></i> Open Edmond on your browser</button>
        </div>`;  
      this.element.querySelector("#appserver")!.addEventListener('click', this.clickHandler.bind(this));
    });

    ipcRenderer.on("abort", (event: Event, result: Record<string, unknown>) => {
      dataFiles.clear();
      this.element.querySelector("nav")!.style.visibility = "hidden";   
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-failed">
        <h5>Selected files couldn't be uploaded!</h5>
       </div>`;  
    });

    ipcRenderer.on('selectFiles', (event: Event, folder: string)  => {
      this.element.querySelector(
        "ul"
      )!.innerHTML = '';
    })

    ipcRenderer.on('clearFiles', (event: Event)  => {
      dataFiles.clear();
      this.element.querySelector(
        "ul"
      )!.innerHTML = '';
      this.element.querySelector("nav")!.style.visibility = "hidden";
    })
  }

  private clickHandler(event: Event) {
    shell.openExternal(process.env.dv_base_uri.replace('/api',''));
  }

  private renderHeader(): void {
    const listId = "research-files-list";
    this.element.querySelector("ul")!.id = listId;
  }

  private renderItems() {
    const listEl = document.getElementById(
      "research-files-list"
    )! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const fileInfo of this.selectedFiles) {
      new FileItem(this.element.querySelector("ul")!.id, fileInfo);
    }
  }

}