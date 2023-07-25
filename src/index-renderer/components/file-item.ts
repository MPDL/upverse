import * as Validation from '../../utils/validation.js';

import Cmp from './base-component';
import { FileInfo } from '../../model/file-info.js';
import { ipcRenderer, dialog } from 'electron';

export class FileItem extends Cmp<HTMLUListElement, HTMLFormElement>
{
  private fileInfo: FileInfo;
  fileListElement: HTMLUListElement;
  descriptionElement: HTMLInputElement;
  relativePathElement: HTMLInputElement;
  actionsElement: HTMLDivElement;
  removeButtonElement: HTMLButtonElement;
  modalElement: HTMLElement;
  modalButtonElement: HTMLButtonElement;
  backdropElement: HTMLElement;

  constructor(listId: string, fileInfo: FileInfo) {
    super('data-file-item', listId, false, 'uploadItems');
    this.fileInfo = fileInfo;

    this.descriptionElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;

    this.relativePathElement = this.element.querySelector(
      '#relativePath'
    ) as HTMLInputElement;

    this.actionsElement = this.element.querySelector(
      '#actions'
    ) as HTMLDivElement;

    this.removeButtonElement = this.element.querySelector(
      '#remove'
    ) as HTMLButtonElement;

    this.fileListElement = this.element.querySelector(
      "#item"
    ) as HTMLUListElement;

    this.modalElement = document.getElementById('alertModal') as HTMLElement;
    this.modalButtonElement = document.getElementById(
      'modalClose'
    ) as HTMLButtonElement;
  
    this.backdropElement = document.getElementById('backdrop') as HTMLElement;

    this.configure(); 
    this.renderContent();
  }

  configure(): void {
    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.removeButtonElement.addEventListener('click', this.removeHandler.bind(this));
    this.modalButtonElement.addEventListener('click', this.closeModal.bind(this));

    this.backdropElement.style.display = "none"
    this.backdropElement.style.visibility = "hidden"

    ipcRenderer.on('SELECTED_FILE_LIST', (event: Event, dummy: string) => {
      this.actionsElement!.innerHTML = '<i class="bi bi-hourglass"></i>'
    })

    ipcRenderer.on('actionFor' + this.fileInfo.id.toString(), (event: Event, action: string, progress?: number) => {
      if (action === 'start') {
        this.actionsElement!.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
        this.fileListElement!.style.backgroundRepeat = "no-repeat";
        this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #0000 30%, #E8F5CF 70%, #F6FFF5)`;
      } else if (action === 'progress') {
        this.fileListElement!.style.backgroundSize = `${progress}%`;
      } else if (action === 'success') {
        this.actionsElement!.innerHTML = '<i class="bi bi-check2-circle"></i>'
        this.fileListElement!.style.backgroundSize = '100%';
        this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #E9F1F3 30%, #F6FFF5 70%)`;
      } else if (action === 'fail') {
        this.actionsElement!.innerHTML = '<i class="bi bi-x-circle"></i>'
        this.fileListElement!.style.backgroundSize = '100%';
        this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #E9F1F3 30%, #0000 70%)`;
      }
      this.actionsElement!.scrollIntoView(false);
    })
  }

  renderContent(): void {
    this.element.id = this.fileInfo.id.toString();
    this.element.querySelector('#filename')!.textContent = this.fileInfo.name;
    this.element.querySelector('#path')!.textContent = this.fileInfo.path;
    this.element.querySelector('#type')!.textContent = this.fileInfo.type ? this.fileInfo.type : 'unknown type';
    this.element.querySelector('#size')!.textContent = this.fileInfo.size.toString();
    if (this.fileInfo.relativePath) {
      this.relativePathElement!.value = this.fileInfo.relativePath;
    }
    if (this.fileInfo.description) {
      this.descriptionElement!.value = this.fileInfo.description;
    }
  }

  private gatherUserInput(): [string, string] | void {
    const description = this.descriptionElement.value;
    const relativePath = this.relativePathElement.value;

    if (relativePath.length != 0) {
      const relativePathValidatable: Validation.Validatable = {
        value: relativePath,
        required: false,
        regexp: /^[a-zA-Z0-9\_\-\.\\\/\s]*$/g,
        alert: "File path cannot contain invalid characters. <br>Valid characters are a-Z, 0-9, '_', '-', '.', '\\', '/' and ' ' (white space)."
      };

      if (
        !Validation.validate(relativePathValidatable)
      ) { 
        this.relativePathElement.value = this.fileInfo.relativePath;
        this.openModal(relativePathValidatable.alert);
        return;
      }
    }

    return [description, relativePath];
  }

  private removeHandler(event: Event) {
    event.preventDefault();
    ipcRenderer.send('DO_FILE_EXCLUDE', this.fileInfo);
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const metadata = this.gatherUserInput();
    if (Array.isArray(metadata)) {
      [this.fileInfo.description, this.fileInfo.relativePath] = metadata;
    }
  }

  private openModal(message:string) {
    this.backdropElement.style.display = "block"
    this.backdropElement.style.visibility = "visible"
    this.modalElement.style.display = "block"
    this.modalElement.classList.add("show");
    this.modalElement.children[0].children[0].children[1].innerHTML = message;
  }

  private closeModal() {
    console.log("closeModal");
    this.backdropElement.style.display = "none"
    this.backdropElement.style.visibility = "hidden"
    this.modalElement.style.display = "none"
    this.modalElement.classList.remove("show");
  }

}
