import * as Validation from '../util/validation.js';

import Cmp from './base-component';
import { FileInfo } from '../../models/file-info';
import { ipcRenderer } from 'electron';

export class FileItem extends Cmp<HTMLUListElement, HTMLFormElement>
 {
  private fileInfo: FileInfo;
  descriptionElement: HTMLInputElement;
  actionsElement: HTMLDivElement;

  constructor(listId: string,fileInfo: FileInfo) {
    super('data-file-item', listId, false, 'uploadItems');
    this.fileInfo = fileInfo;

    this.descriptionElement = this.element.querySelector(
      'input'
    ) as HTMLInputElement;

    this.actionsElement = this.element.querySelector(
      '#actions'
    ) as HTMLDivElement;

    this.configure();
    this.renderContent();
  }

  configure():void {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
    this.element.addEventListener('change', this.changeHandler.bind(this));
    
    ipcRenderer.on('selectedFiles', (event: Event, dummy: string)  => {
      this.actionsElement!.innerHTML = '<i class="bi bi-hourglass"></i>'
    })  

    ipcRenderer.on('actionFor' + this.fileInfo.id.toString(), (event: Event, action: string)  => {
      if (action === 'start') {
        this.actionsElement!.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
      } else if (action === 'success') {
        this.actionsElement!.innerHTML = '<i class="bi bi-check2-circle"></i>'
      } else if (action === 'fail') {
        this.actionsElement!.innerHTML = '<i class="bi bi-x-circle"></i>'
      }
      this.actionsElement!.scrollIntoView();
    })  
  }

  renderContent():void {
    this.element.id = this.fileInfo.id.toString();
    this.element.querySelector('#path')!.textContent = this.fileInfo.relativePath;
    this.element.querySelector('#type')!.textContent = this.fileInfo.type;
    this.element.querySelector('#size')!.textContent = this.fileInfo.size.toString();
    this.element.querySelector('input')!.textContent = this.fileInfo.description;
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
    ipcRenderer.send('removeItem', this.fileInfo);
  }
}
