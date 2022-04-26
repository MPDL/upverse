import * as Validation from '../util/validation.js';

import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { ipcRenderer } from 'electron';

// ProjectInput Class
export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLTableElement;
  enteredFiles: FileInfo[];

  constructor() {
    super('data-file-list', 'app-file-list', true, 'file2upload-list');
    this.fileListElement = this.element.querySelector(
      '#file-list'
    ) as HTMLTableElement;
    this.enteredFiles = [];

    this.configure();
  }

  configure():void {
    ipcRenderer.on('selectedFiles', (event: Event, files: FileInfo[])  => {
      console.log('\nipcRenderer.on(selectedFiles): \nfiles: ' + JSON.stringify(files));
      console.log("event " + JSON.stringify(event));
      if(files.length) {
        this.enteredFiles = files;
        this.renderContent();
      }
    })

  }

  renderContent():void {

    this.fileListElement.createTHead().innerHTML = '<th>Type</th><th>Name</th><th>Size</th>';
    this.enteredFiles.forEach((file) => {
      this.fileListElement.insertRow().innerHTML = `<td>${file.type}</td><td>${file.name}</td><td>${file.size}</td>`;
    });

  }

}
