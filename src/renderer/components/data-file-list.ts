import { ipcRenderer, shell } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  selectedFiles: FileInfo[];

  firstPageElement: HTMLButtonElement;
  previousPageElement: HTMLButtonElement;
  currentPageElement: HTMLSpanElement;
  nextPageElement: HTMLButtonElement;
  lastPageElement: HTMLButtonElement;

  pageSize = 10;
  numPages = 1;
  currentPage = 1;
  lastPage = 1;

  constructor() {
    super("data-file-list", "app-file-list", true, "file2upload-list");
    this.fileListElement = this.element.querySelector(
      "#file-list"
    ) as HTMLUListElement;
    this.firstPageElement = this.element.querySelector(
      "#firstPage"
    ) as HTMLButtonElement;
    this.previousPageElement = this.element.querySelector(
      "#previousPage"
    ) as HTMLButtonElement; 
    this.currentPageElement = this.element.querySelector(
      "#currentPage"
    ) as HTMLButtonElement; 
    this.nextPageElement = this.element.querySelector(
      "#nextPage"
    ) as HTMLButtonElement; 
    this.lastPageElement = this.element.querySelector(
      "#lastPage"
    ) as HTMLButtonElement;  
   
    this.selectedFiles = [];

    this.configure();
    this.renderHeader();
  }

  configure(): void {
    ipcRenderer.setMaxListeners(65000);

    dataFiles.addListener((files: FileInfo[]) => {
      this.selectedFiles = files; 
      this.numPages = Math.ceil(this.selectedFiles.length/this.pageSize);
      this.currentPage = 1;
      this.lastPage = this.numPages; 
      this.renderPage();
      if (this.numPages > 1) this.renderPaginator();
    });

    this.firstPageElement.addEventListener("click", () => {
      this.currentPage = 1;
      this.renderPage();
      this.updatePaginator();
    });

    this.previousPageElement.addEventListener("click", () => {
      if (this.currentPage > 1) { this.currentPage--; };
      this.renderPage();
      this.updatePaginator();
    });

    this.nextPageElement.addEventListener("click", () => {
      if (this.currentPage < this.numPages) { this.currentPage++; };
      this.renderPage();
      this.updatePaginator();
    });

    this.lastPageElement.addEventListener("click", () => {
      this.currentPage = this.numPages;
      this.renderPage();
      this.updatePaginator();
    });

    ipcRenderer.on("removeItem", (event: Event, file: FileInfo) => {
      dataFiles.removeDataFile(file);
    });

    ipcRenderer.on("end", (event: Event, result: Record<string, unknown>) => {
      dataFiles.clear();
      this.element.querySelector("nav")!.style.visibility = "hidden";   
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

  private updatePaginator() {
    this.currentPageElement.innerHTML = `${this.currentPage}/${this.numPages}`
  }

  private renderHeader(): void {
    const listId = "research-files-list";
    this.element.querySelector("ul")!.id = listId;
  }

  private renderPaginator(): void {
      this.updatePaginator()
      this.element.querySelector("nav")!.style.visibility = "visible";
  }  

  private renderPage() {
    const listEl = document.getElementById(
      "research-files-list"
    )! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const fileInfo of this.selectedFiles.slice(this.currentPage * this.pageSize - this.pageSize, this.currentPage * this.pageSize)) {
      new FileItem(this.element.querySelector("ul")!.id, fileInfo);
    }
    this.lastPage = this.currentPage;
    if (this.numPages > 1) this.updatePaginator();
  }

}