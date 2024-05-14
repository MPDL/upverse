import * as Validation from '../../utils/validation';

import Cmp from './base-component.js';
import { dataFiles } from '../data-files';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { FileInfo } from "../../model/file-info";

export class DataFilesInput extends Cmp<HTMLDivElement, HTMLFormElement> {
  filesButtonElement: HTMLButtonElement;
  folderButtonElement: HTMLButtonElement;
  resetButtonElement: HTMLButtonElement;
  submitButtonElement: HTMLButtonElement;
  cancelButtonElement: HTMLButtonElement;

  modalElement: HTMLElement;
  modalButtonElement: HTMLButtonElement;
  backdropElement: HTMLElement;

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

    this.modalElement = document.getElementById('alertModal') as HTMLElement;
    this.modalButtonElement = document.getElementById(
      'modalClose'
    ) as HTMLButtonElement;
  
    this.backdropElement = document.getElementById('backdrop') as HTMLElement;

    this.configure();
  }

  configure():void {
    const regexp = /[:;#<>"\*\?\/\|]/ ;
    const regexp2 = /[^A-Za-z0-9_ .\/\-]+/ ;

    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.filesButtonElement.addEventListener('click', this.filesHandler.bind(this));
    this.folderButtonElement.addEventListener('click', this.folderHandler.bind(this));
    this.resetButtonElement.addEventListener('click', this.resetHandler.bind(this));
    this.submitButtonElement.addEventListener('click', this.submitHandler.bind(this));
    this.cancelButtonElement.addEventListener('click', this.cancelHandler.bind(this)); 

    this.modalButtonElement.addEventListener('click', this.closeModal.bind(this));

    this.backdropElement.style.display = "none";
    this.backdropElement.style.visibility = "hidden";

    ipcRenderer.on('DO_FILE_SELECT', (event: IpcRendererEvent, folder: string, filesCount: number)  => {
      if (this.isDSSelected()) {
        this.filesButtonElement.disabled = false;
      } else {
        this.filesButtonElement.disabled = true;
      }
      dataFiles.clear();
    })

    ipcRenderer.on('FILE_SELECT_DONE', (event: IpcRendererEvent, enteredFiles: FileInfo[])  => { 
      this.clearView();
      if (enteredFiles.length) {
        const files = Array.from(enteredFiles);
        enteredFiles.forEach((file) => {
          if (!regexp.test(file.name)) {
            dataFiles.addFile(file);
          } else {
            this.openModal(`<strong>${file.name}</strong> excluded from your selection! <hr>File Name cannot contain any of the following characters: <br/><strong> /  :  *  ?  \"  <  >  |  ; #</strong>`);    
          }
        });
        if (dataFiles.length()) {
          if (this.isDSSelected()) {
            this.submitButtonElement.disabled = false;
          }
          this.resetButtonElement.disabled = false;
        }
      }
    })

    ipcRenderer.on('DO_FOLDER_SELECT', (event: IpcRendererEvent, folder: string, filesCount: number)  => {
      if (this.isDSSelected()) {
        this.folderButtonElement.disabled = false;
      } else {
        this.folderButtonElement.disabled = true;
      }
      dataFiles.clear();
    })

    ipcRenderer.on('FOLDER_SELECT_DONE', (event: IpcRendererEvent, enteredFiles: FileInfo[])  => { 
      this.clearView();
      if (enteredFiles.length) {;
        let lastPath = '';
        const files = Array.from(enteredFiles);
        enteredFiles.forEach((file) => {
          if (!regexp2.test(file.relativePath)) {
            if (!regexp.test(file.name)) {
              dataFiles.addFile(file);
            } else {
              this.openModal(`<strong>${file.name}</strong> excluded from your selection! <hr>File Name cannot contain any of the following characters: <br/><strong> /  :  *  ?  \"  <  >  |  ; #</strong>`);    
            }
          } else {
            if (file.relativePath !== lastPath) {
              this.openModal(`Directory <strong>${file.relativePath}</strong> name cannot contain invalid characters! <hr>Valid characters are: <br/><strong> a-Z  0-9  _  -  .  \\  /  </strong>and ' ' (white space).`);    
              lastPath = file.relativePath;
            }
          }
        });
        if (dataFiles.length()) {
          if (this.isDSSelected()) {
            this.submitButtonElement.disabled = false;
          }
          this.resetButtonElement.disabled = false;
        }
      } else {
        alert(`The selected folder is empty, please select a folder that contains files`);
      }
    })

    ipcRenderer.on('UPLOAD_DONE', (event: IpcRendererEvent, result: Record<string, unknown>)  => {
      this.remainingFiles = this.remainingFiles - Number(result.numFilesUploaded);
      this.actionButtons({cancel: true, files: false, folder: false});
      this.nextUpload();
    })  

    ipcRenderer.on('UPLOAD_FAILED', (event: IpcRendererEvent, dummy: string)  => {
      this.actionButtons({cancel: true, files: false, folder: false});
      this.nextUpload();
    })

  }

  nextUpload():void {
    dataFiles.clear();
    this.submitButtonElement.innerHTML = ' <i class="bi bi-upload d-none d-xxl-inline"></i> Upload ';
  }

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
    if (dataFiles.length()) {
      this.actionButtons({files: true, folder: true, clear: true, upload: true, cancel: false});
      ipcRenderer.send('DO_UPLOAD', dataFiles.getAll());
    } 
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
    if (enteredFiles.length) {
      for (const file of enteredFiles) {
        dataFiles.addFile(file);
      };
      this.actionButtons({files: true, folder: true, clear: true, upload: true, cancel: false});
    } else {
      this.actionButtons({files: false, folder: false, clear: true, upload: true, cancel: true});
    }
  }

  private resetHandler(event: Event) {
    event.preventDefault();
    dataFiles.clear();
    this.actionButtons({files: false, folder: false, clear: true, upload: true, cancel: true});
    ipcRenderer.send('DO_CLEAR_SELECTED');
  }

  private cancelHandler(event: Event) {
    event.preventDefault();
    dataFiles.clear();
    this.submitButtonElement.innerHTML = ' <i class="bi bi-upload d-none d-xxl-inline"></i> Upload ';
    this.actionButtons({files: false, folder: false, clear: true, upload: true, cancel: true});
    ipcRenderer.send('DO_ABORT');
  }

  private clearView() {
    const doneElement = document.getElementById('upload-done');
    if (doneElement) {
      doneElement.innerHTML = '';
    }
    const failedElement = document.getElementById('upload-failed');
    if (failedElement) {
      failedElement.innerHTML = '';
    }
  }

  private isDSSelected(): boolean {
    const dsSelected = document.getElementById("dataset") as HTMLInputElement;
    if (dsSelected.value.length > 0 && dsSelected.value[0].length > 0) {
      return true;
    } else {
      return false;
    }
  }

  private actionButtons(enabled: {files?: boolean, folder?: boolean , clear?: boolean, upload?: boolean, cancel?: boolean}):void {    
    if (typeof enabled.files !== 'undefined') this.filesButtonElement.disabled = enabled.files;
    if (typeof enabled.folder !== 'undefined') this.folderButtonElement.disabled = enabled.folder;
    if (typeof enabled.clear !== 'undefined') this.resetButtonElement.disabled = enabled.clear;
    if (typeof enabled.upload !== 'undefined') this.submitButtonElement.disabled = enabled.upload;
    if (typeof enabled.cancel !== 'undefined') this.cancelButtonElement.disabled = enabled.cancel;
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