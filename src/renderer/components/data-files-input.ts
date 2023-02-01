import * as Validation from '../util/validation';

import Cmp from './base-component.js';
import { dataFiles } from '../data-files';
import { ipcRenderer } from 'electron';

export class DataFilesInput extends Cmp<HTMLDivElement, HTMLFormElement> {
  filesSelectElement: HTMLInputElement;
  filesLabelElement: HTMLLabelElement;
  resetButtonElement: HTMLButtonElement;
  submitButtonElement: HTMLButtonElement;

  maxFiles: number;

  constructor() {
    super('data-files', 'app-files', true, 'files2upload');
    this.filesSelectElement = this.element.querySelector(
      '#files'
    ) as HTMLInputElement;
    this.filesLabelElement = this.element.querySelector(
      '#files-label'
    ) as HTMLLabelElement;
    this.resetButtonElement = this.element.querySelector(
      '#clear'
    ) as HTMLButtonElement;
    this.submitButtonElement = this.element.querySelector(
      '#upload'
    ) as HTMLButtonElement;
    this.configure();
  }

  configure():void {
    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.element.addEventListener('reset', this.resetHandler.bind(this));
    this.element.addEventListener('submit', this.submitHandler.bind(this));
 
    ipcRenderer.on('selectFiles', (event: Event, folder: string, filesCount: number)  => {
      this.filesSelectElement.disabled = false;
      this.filesLabelElement.classList.remove("label-disabled");
      this.maxFiles = 2000 - filesCount;
    })

    ipcRenderer.on('filesSelected', (event: Event, dummy: string)  => {
      this.submitButtonElement.disabled = false;
      this.resetButtonElement.disabled = false;
    })

    ipcRenderer.on('end', (event: Event, result: Record<string, unknown>)  => {
      this.maxFiles = this.maxFiles - Number(result.numFilesUploaded);
      this.nextUpload();
    })  

    ipcRenderer.on('abort', (event: Event, dummy: string)  => {
      this.nextUpload();
    })      
  }

  nextUpload():void {
    this.submitButtonElement.innerHTML = ' <i class="bi bi-upload"></i> Upload '
    this.filesSelectElement.value = null;
  }

  renderContent():void {console.log("renderContent")}

  private gatherUserInput(): FileList {
    const enteredFiles = this.filesSelectElement.files;
    const filesValidatable: Validation.Validatable = {
      value: enteredFiles.length,
      required: true,
      min: 1,
      max: this.maxFiles
    };

    if (
      !Validation.validate(filesValidatable)
    ) {
      alert(`Upload limited to ${this.maxFiles} files, \nfor a larger amount please use a zip format!`);
      return;
    } else {
      const element = document.getElementById("upload-done");
      if (element) element.remove();
      return enteredFiles;
    }
  }

  private submitHandler(event: Event) {
    event.preventDefault();
    this.submitButtonElement.disabled = true;
    this.resetButtonElement.disabled = true;
    this.submitButtonElement.innerHTML = 'Uploading';

    ipcRenderer.send('filesSelected', dataFiles.getAll());
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const enteredFiles = this.gatherUserInput();
    if (enteredFiles) {
      const files = Array.from(enteredFiles);
      files.forEach((file) => {
        dataFiles.addFile(file);
      });
      this.submitButtonElement.disabled = false;
      this.resetButtonElement.disabled = false;
    }
  }

  private resetHandler(event: Event) {
    event.preventDefault();
    this.filesSelectElement.value = null;
    dataFiles.clear();
    this.submitButtonElement.disabled = true;
    this.resetButtonElement.disabled = true;
    
    ipcRenderer.send('filesCleared');
  }
}
