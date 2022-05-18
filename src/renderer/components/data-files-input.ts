import * as Validation from '../util/validation';

import Cmp from './base-component.js';
import { dataFiles } from '../data-files';
import { ipcRenderer } from 'electron';

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
    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.element.addEventListener('submit', this.submitHandler.bind(this));

    ipcRenderer.on('selectFiles', (event: Event, folder: string)  => {
      this.filesSelectElement.disabled = false;
    })

    ipcRenderer.on('filesSelected', (event: Event, dummy: string)  => {
      this.submitButtonElement.disabled = false;
    })

    ipcRenderer.on('end', (event: Event, dummy: string)  => {
      this.submitButtonElement.innerHTML = '<i class="bi bi-upload"></i> Upload'
      this.filesSelectElement.value = null;
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

  private submitHandler(event: Event) {
    event.preventDefault();
    dataFiles.getAll().forEach((file) => {
      console.log(JSON.stringify(file))
    })
    this.submitButtonElement.disabled = true;
    this.submitButtonElement.innerHTML = 'Uploading...'

    ipcRenderer.send('filesSelected', dataFiles.getAll());
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const enteredFiles = this.gatherUserInput();

    const files = Array.from(enteredFiles);
    files.forEach((file) => {
      dataFiles.addFile(file);
    });
    this.submitButtonElement.disabled = false;
  }

}
