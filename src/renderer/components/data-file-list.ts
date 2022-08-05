import { ipcRenderer, shell } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  selectedFiles: FileInfo[];

  firstPageElement: HTMLLinkElement;
  previousPageElement: HTMLLinkElement;
  nextPageElement: HTMLLinkElement;
  lastPageElement: HTMLLinkElement;

  lastPointer = 0;

  constructor() {
    super("data-file-list", "app-file-list", true, "file2upload-list");
    this.fileListElement = this.element.querySelector(
      "#file-list"
    ) as HTMLUListElement;
    this.firstPageElement = this.element.querySelector(
      "#firstPage"
    ) as HTMLLinkElement;
    this.previousPageElement = this.element.querySelector(
      "#previousPage"
    ) as HTMLLinkElement; 
    this.nextPageElement = this.element.querySelector(
      "#nextPage"
    ) as HTMLLinkElement; 
    this.lastPageElement = this.element.querySelector(
      "#lastPage"
    ) as HTMLLinkElement;     
    this.selectedFiles = [];

    this.configure();
    this.renderHeader();
  }

  configure(): void {
    ipcRenderer.setMaxListeners(65000);

    dataFiles.addListener((files: FileInfo[]) => {
      this.selectedFiles = files;
      this.renderItems(0);
      this.renderPaginator();
    });

    this.firstPageElement.addEventListener("click", () => {
      this.renderItems(0);
    });

    this.previousPageElement.addEventListener("click", () => {
      this.renderItems(this.lastPointer < 10 ? (0) : (this.lastPointer -= 10));
    });

    this.nextPageElement.addEventListener("click", () => {
      this.renderItems(this.selectedFiles.length <= 10 ? (0) : (this.lastPointer < this.selectedFiles.length - 10 ? (this.lastPointer += 10) : (this.lastPointer)));
    });

    this.lastPageElement.addEventListener("click", () => {
      this.renderItems(this.selectedFiles.length <= 10 ? (0) : (this.lastPointer > this.selectedFiles.length - 10 ? (this.lastPointer) : (this.lastPointer  += 10)));
      //this.renderItems(this.selectedFiles.length - 10);
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
        this.element.querySelector(
          ".pagination"
        )!.innerHTML = "";      
      this.element.querySelector("#appserver")!.addEventListener('click', this.clickHandler.bind(this));
    });

    ipcRenderer.on('selectFiles', (event: Event, folder: string)  => {
      this.element.querySelector(
        "ul"
      )!.innerHTML = '';
    })
  }

  private clickHandler(event: Event) {
    shell.openExternal(process.env.dv_base_uri.replace('/api',''));
  }

  renderHeader(): void {
    const listId = "research-files-list";
    this.element.querySelector("ul")!.id = listId;
  }

  renderPaginator(): void {
    this.element.querySelector("nav")!.style.visibility = "visible";
  }  

  private renderItems(itemPointer: number = 0) {
    const listEl = document.getElementById(
      "research-files-list"
    )! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const fileInfo of this.selectedFiles.slice(itemPointer, itemPointer + 10)) {
      new FileItem(this.element.querySelector("ul")!.id, fileInfo);
    }
    this.lastPointer = itemPointer;
  }

}