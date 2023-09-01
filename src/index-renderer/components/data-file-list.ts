import { ipcRenderer, shell } from 'electron';

import Cmp from './base-component.js';
import { FileInfo } from "../../model/file-info.js";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  openDatasetElement: HTMLLinkElement;

  modalElement: HTMLElement;
  modalButtonElement: HTMLButtonElement;
  backdropElement: HTMLElement;

  selectedFiles: FileInfo[];

  constructor() {
    super("data-file-list", "app-file-list", true, "file2upload-list");
    this.fileListElement = this.element.querySelector(
      "#research-files-list"
    ) as HTMLUListElement;

    this.modalElement = document.getElementById('alertModal') as HTMLElement;
    this.modalButtonElement = document.getElementById(
      'modalClose'
    ) as HTMLButtonElement;
  
    this.backdropElement = document.getElementById('backdrop') as HTMLElement;
    
    this.selectedFiles = [];

    this.configure();
  }

  configure(): void {
    this.modalButtonElement.addEventListener('click', this.closeModal.bind(this));

    this.backdropElement.style.display = "none"
    this.backdropElement.style.visibility = "hidden"

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

    ipcRenderer.on("UPLOAD_DONE", (event: Event, result: Record<string, unknown>, repository: string) => {
      this.selectedFiles = [];
      dataFiles.clear(); 
      
      this.element.querySelector(
        "ul"
      )!.innerHTML = `<div id="upload-done">
        <h5>${result.numFiles2Upload}<i> files to upload, </i>${(result.numFiles2Upload as number) - (result.numFilesUploaded as number)} fails</h5>
        <h5>${result.numFilesUploaded}<i> files uploaded to </i>${result.destination}</h5>
        <br>
        <a id="open-dataset" href="${repository}/dataset.xhtml?persistentId=${result.destination}&version=DRAFT" target="_blank"><button class="btn btn-secondary"><i class="bi bi-card-checklist"></i> Open Dataset</button></a>
        </div>`; 
      this.openDatasetElement = document.getElementById(
        'open-dataset'
      ) as HTMLLinkElement;
      this.openDatasetElement.addEventListener('click', this.openDatasetHandler.bind(this)); 

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
    let regexp = /[:;#<>"\*\?\/\|]/ ;
    if (!regexp.test(fileInfo.name)) {
      new FileItem(this.element.querySelector("ul")!.id, fileInfo);
    } else {
      this.openModal(`<strong>${fileInfo.name}</strong> excluded from your selection! <hr>File Name cannot contain any of the following characters: <br/><strong> /  :  *  ?  \"  <  >  |  ; #</strong>`);
    }
  }

  private clearItemList() {
    this.fileListElement.innerHTML = '';
  }

  private openDatasetHandler(event: Event) {
    event.preventDefault();

    shell.openExternal(this.openDatasetElement.href); 
  }

  private openModal(message:string) {
    this.backdropElement.style.display = "block"
    this.backdropElement.style.visibility = "visible"
    this.modalElement.style.display = "block"
    this.modalElement.classList.add("show");
    this.modalElement.children[0].children[0].children[1].innerHTML = message;
  }

  private closeModal() {
    this.backdropElement.style.display = "none"
    this.backdropElement.style.visibility = "hidden"
    this.modalElement.style.display = "none"
    this.modalElement.classList.remove("show");
  }

}