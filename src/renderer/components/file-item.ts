import * as Validation from '../util/validation.js';

import Cmp from './base-component';
import { FileInfo } from '../../models/file-info';
import { ipcRenderer } from 'electron';

export class FileItem extends Cmp<HTMLUListElement, HTMLFormElement>
{
  private fileInfo: FileInfo;
  fileListElement: HTMLUListElement;
  descriptionElement: HTMLInputElement;
  actionsElement: HTMLDivElement;

  status: String; 

  constructor(listId: string, fileInfo: FileInfo) {
    super('data-file-item', listId, false, 'uploadItems');
    this.fileInfo = fileInfo;

    this.descriptionElement = this.element.querySelector(
      'input'
    ) as HTMLInputElement;

    this.actionsElement = this.element.querySelector(
      '#actions'
    ) as HTMLDivElement;

    this.fileListElement = this.element.querySelector(
      "#item"
    ) as HTMLUListElement;

    this.configure();
    this.renderContent();
  }

  configure(): void {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
    this.element.addEventListener('change', this.changeHandler.bind(this));

    ipcRenderer.on('selectedFiles', (event: Event, dummy: string) => {
      this.actionsElement!.innerHTML = '<i class="bi bi-hourglass"></i>'
    })

    ipcRenderer.on('actionFor' + this.fileInfo.id.toString(), (event: Event, action: string, progress?: number) => {
      if (action === 'start') {
        this.actionsElement!.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
      } else if (action === 'progress') {
        //this.actionsElement!.innerHTML = `<p>${progress}</p>`
        setTimeout(()=>{
          this.fileListElement!.style.backgroundRepeat = "no-repeat";
          this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #0000 30%, #e8f5cf 70%, #F6FFF5)`;
          this.fileListElement!.style.backgroundSize = `${progress}%`;}, 
        progress*(this.fileInfo.size/50000000));
      } else if (action === 'success') {
        this.actionsElement!.innerHTML = '<i class="bi bi-check2-circle"></i>'
        this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #E9F1F3 30%, #F6FFF5 70%)`;
        this.status = 'success';
      } else if (action === 'fail') {
        this.actionsElement!.innerHTML = '<i class="bi bi-x-circle"></i>'
        this.status = 'fail';
      }
      this.actionsElement!.scrollIntoView(false);
    })
  }

  renderContent(): void {
    this.element.id = this.fileInfo.id.toString();
    this.element.querySelector('#path')!.textContent = this.fileInfo.relativePath;
    this.element.querySelector('#type')!.textContent = this.fileInfo.type ? this.fileInfo.type : 'unknown type';
    this.element.querySelector('#size')!.textContent = this.fileInfo.size.toString();
    if (this.fileInfo.description) {
      this.element.querySelector('input')!.value = this.fileInfo.description;
    }
    if (this.status === 'success') {
      this.fileListElement!.style.backgroundImage = `linear-gradient(to right, #E9F1F3 30%, #F6FFF5 70%)`;  
    } else if (this.status === 'fail') {
      this.actionsElement!.innerHTML = '<i class="bi bi-x-circle"></i>'
    } else if (!this.status) {
      this.actionsElement!.innerHTML = '<button id="remove-file" type="submit"><i class="bi bi-trash"></i></button>';
    }
  }

  private gatherUserInput(): string {
    const description = this.descriptionElement.value;

    const descriptionValidatable: Validation.Validatable = {
      value: description,
      required: true,
      minLength: 1
    };

    if (
      !Validation.validate(descriptionValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return description;
    }
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    this.fileInfo.description = this.gatherUserInput();
  }

  private submitHandler(event: Event) {
    event.preventDefault();
    console.log(
      "ipcRenderer.send('removeItem', this.fileInfo)"
    );
    ipcRenderer.send('removeItem', this.fileInfo);
  }
}
