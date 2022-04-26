import * as Validation from '../util/validation.js';

import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { ipcRenderer } from 'electron';

// ProjectInput Class
export class DataFilesInput extends Cmp<HTMLDivElement, HTMLFormElement> {
  filesSelectElement: HTMLInputElement;
  submitButtonElement: HTMLButtonElement;

  constructor() {
    super('data-files', 'app-files', true, 'files2upload');
    this.filesSelectElement = this.element.querySelector(
      '#files'
    ) as HTMLInputElement;
    this.submitButtonElement = this.element.querySelector(
      '#upload'
    ) as HTMLButtonElement;
    this.configure();
  }

  configure():void {
    this.element.addEventListener('submit', this.submitHandler.bind(this));

    ipcRenderer.on('selectFiles', (event: Event, folder: string)  => {
      //console.log('\nipcRenderer.on(selectFiles): \nfolder: ' + folder);
      //console.log("event " + JSON.stringify(event));
      this.filesSelectElement.disabled = false;
      this.submitButtonElement.disabled = false;
    })

  }

  renderContent():void {console.log("renderContent")}

  private gatherUserInput(): FileList {
    const enteredFiles = this.filesSelectElement.files;
    const filesValidatable: Validation.Validatable = {
      value: enteredFiles.length,
      required: true,
      min: 1
    };

    if (
      !Validation.validate(filesValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return enteredFiles;
    }
  }
/*
  private clearInputs() {
    this.datasetSelectElement.value = '';
  }
*/

  private submitHandler(event: Event) {
    event.preventDefault();
    const enteredFiles = this.gatherUserInput();
    const files = Array.from(enteredFiles);
    const filesToUpload: FileInfo[] = [];
    files.forEach((file) => {
      filesToUpload.push({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          lastModifiedDate: new Date(file.lastModified)
      });
    });
    //console.log('\nipcRenderer.send(filesSelected): \nfilesToUpload: '+JSON.stringify(filesToUpload));
    ipcRenderer.send('filesSelected', filesToUpload);
  }

}
