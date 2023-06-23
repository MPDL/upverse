import * as Validation from '../../utils/validation';

import Cmp from './base-component.js';
import { dataFiles } from '../data-files';
import { ipcRenderer } from 'electron';
import { FileInfo } from "../../model/file-info";

export class DataFilesInput extends Cmp<HTMLDivElement, HTMLFormElement> {
  filesButtonElement: HTMLButtonElement;
  folderButtonElement: HTMLButtonElement;
  resetButtonElement: HTMLButtonElement;
  submitButtonElement: HTMLButtonElement;
  cancelButtonElement: HTMLButtonElement;

  MAXFILES: number;
  remainingFiles: number;
  enteredFiles: FileInfo[]

  constructor() {
    super('data-files', 'app-files', true, 'files2upload');
    this.filesButtonElement = this.element.querySelector(
      '#files'
    ) as HTMLButtonElement;
    this.folderButtonElement = this.element.querySelector(
      '#folder'
    ) as HTMLButtonElement;
    this.resetButtonElement = this.element.querySelector(
      '#clear'
    ) as HTMLButtonElement;
    this.submitButtonElement = this.element.querySelector(
      '#upload'
    ) as HTMLButtonElement;
    this.cancelButtonElement = this.element.querySelector(
      '#cancel'
    ) as HTMLButtonElement;

    this.configure();
  }

  configure():void {
    this.MAXFILES = 2000;

    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.filesButtonElement.addEventListener('click', this.filesHandler.bind(this));
    this.folderButtonElement.addEventListener('click', this.folderHandler.bind(this));
    this.resetButtonElement.addEventListener('click', this.resetHandler.bind(this));
    this.submitButtonElement.addEventListener('click', this.submitHandler.bind(this));
    this.cancelButtonElement.addEventListener('click', this.cancelHandler.bind(this)); 

    ipcRenderer.on('DO_FILE_SELECT', (event: Event, folder: string, filesCount: number)  => {
      const dsSelected = document.getElementById("dataset") as HTMLInputElement;
      if (dsSelected.value.length > 0 && dsSelected.value[0].length > 0) {
        this.filesButtonElement.disabled = false;
      } else {
        this.filesButtonElement.disabled = true;
      }
      //dataFiles.clear();
      this.remainingFiles = this.MAXFILES - filesCount;
    })

    ipcRenderer.on('FILE_SELECT_DONE', (event: Event, enteredFiles: FileInfo[])  => { 
      const doneElement = document.getElementById('upload-done');
      if (doneElement) {
        doneElement.innerHTML = '';
      }
      if (enteredFiles) {
        const files = Array.from(enteredFiles);
        enteredFiles.forEach((file) => {
          dataFiles.addFile(file);
        });
        const dsSelected = document.getElementById("dataset") as HTMLInputElement;
        if (dsSelected.value.length > 0 && dsSelected.value[0].length > 0) {
          this.submitButtonElement.disabled = false;
        }
        this.resetButtonElement.disabled = false;
      }
    })

    ipcRenderer.on('DO_FOLDER_SELECT', (event: Event, folder: string, filesCount: number)  => {
      const dsSelected = document.getElementById("dataset") as HTMLInputElement;
      if (dsSelected.value.length > 0 && dsSelected.value[0].length > 0) {
        this.folderButtonElement.disabled = false;
      } else {
        this.folderButtonElement.disabled = true;
      }
      //dataFiles.clear();
      this.remainingFiles = this.MAXFILES - filesCount;
    })

    ipcRenderer.on('FOLDER_SELECT_DONE', (event: Event, enteredFiles: FileInfo[])  => { 
      const doneElement = document.getElementById('upload-done');
      if (doneElement) {
        doneElement.innerHTML = '';
      }
      if (enteredFiles) {
        const files = Array.from(enteredFiles);
        enteredFiles.forEach((file) => {
          dataFiles.addFile(file);
        });
        const dsSelected = document.getElementById("dataset") as HTMLInputElement;
        if (dsSelected.value.length > 0 && dsSelected.value[0].length > 0) {
          this.submitButtonElement.disabled = false;
        }
        this.resetButtonElement.disabled = false;
      }
    })

    ipcRenderer.on('UPLOAD_DONE', (event: Event, result: Record<string, unknown>)  => {
      this.remainingFiles = this.remainingFiles - Number(result.numFilesUploaded);
      this.nextUpload();
    })  

    ipcRenderer.on('UPLOAD_FAILED', (event: Event, dummy: string)  => {
      this.nextUpload();
    })

  }

  nextUpload():void {
    dataFiles.clear();
    this.submitButtonElement.innerHTML = ' <i class="bi bi-upload d-none d-xxl-inline"></i> Upload ';
  }

  renderContent():void {console.log("renderContent")}

  private gatherUserInput(): FileInfo[] {
    const enteredFiles = dataFiles.getAll();
    const filesValidatable: Validation.Validatable = {
      value: enteredFiles.length,
      required: true,
      min: 1,
      max: this.remainingFiles
    };

    if (
      !Validation.validate(filesValidatable)
    ) {
      alert(`Dataset files limited to ${this.MAXFILES}, \n${this.MAXFILES - this.remainingFiles} uploaded, \n${this.remainingFiles} more files available, \nfor a larger amount of files, please use a zip file!`);
      return;
    } else {
      return enteredFiles;
    }
  }

  private submitHandler(event: Event) {
    event.preventDefault();
    this.filesButtonElement.disabled = true;
    this.folderButtonElement.disabled = true;
    this.resetButtonElement.disabled = true;
    this.submitButtonElement.disabled = true;
    this.cancelButtonElement.disabled = false; 
    ipcRenderer.send('DO_UPLOAD', dataFiles.getAll());
  }

  private filesHandler(event: Event) {
    event.preventDefault();
    ipcRenderer.send('DO_FILE_SELECT');
  }

  private folderHandler(event: Event) {
    event.preventDefault();
    ipcRenderer.send('DO_FOLDER_SELECT');
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const enteredFiles = this.gatherUserInput(); 
    if (enteredFiles) {
      for (const file of enteredFiles) {
        dataFiles.addFile(file);
      };
      this.submitButtonElement.disabled = false;
      this.resetButtonElement.disabled = false;
    }
  }

  private resetHandler(event: Event) {
    event.preventDefault();
    dataFiles.clear();
    this.submitButtonElement.disabled = true;
    this.resetButtonElement.disabled = true;
    
    ipcRenderer.send('DO_CLEAR_SELECTED');
  }

  private cancelHandler(event: Event) {
    event.preventDefault();
    dataFiles.clear();
    this.submitButtonElement.innerHTML = ' <i class="bi bi-upload d-none d-xxl-inline"></i> Upload ';
    this.resetButtonElement.disabled = true;
    this.submitButtonElement.disabled = true;
    this.cancelButtonElement.disabled = true;
    ipcRenderer.send('DO_ABORT');
  }

}
