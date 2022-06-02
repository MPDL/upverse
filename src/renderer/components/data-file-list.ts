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
    ipcRenderer.setMaxListeners(2000);

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
      )!.innerHTML = `<h5>${result.files}<i> files uploaded to </i>${result.destination}</h5>
        <br>
        <button id="appserver" class="btn btn-secondary" type="submit"><i class="bi bi-card-checklist"></i> Open Edmond on your browser</button>`;
      this.element.querySelector("#appserver")!.addEventListener('click', this.clickHandler.bind(this));  
    });
  }

  private clickHandler(event: Event) {
    shell.openExternal(process.env.dv_base_uri.replace('/api',''));
  }

  renderHeader(): void {
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
