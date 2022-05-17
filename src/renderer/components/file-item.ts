import * as Validation from '../util/validation.js';

import Cmp from './base-component';
import { FileInfo } from '../../models/file-info';
import { ipcRenderer } from 'electron';

export class FileItem extends Cmp<HTMLUListElement, HTMLFormElement>
 {
  private fileInfo: FileInfo;
  descriptionElement: HTMLInputElement;

  constructor(listId: string,fileInfo: FileInfo) {
    super('data-file-item', listId, true, 'uploadItems');
    this.fileInfo = fileInfo;

    this.descriptionElement = this.element.querySelector(
      'input'
    ) as HTMLInputElement;

    this.configure();
    this.renderContent();
  }

  configure():void {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
    this.element.addEventListener('change', this.changeHandler.bind(this));
  }

  renderContent():void {
    this.element.id = this.fileInfo.id.toString();
    this.element.querySelector('#path')!.textContent = this.fileInfo.path;
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

  private submitHandler(event: Event) {
    event.preventDefault();
    this.fileInfo.description = this.gatherUserInput();
    console.log('\nFileItem onSubmit:\n' + this.element.id + "\n" + this.element.querySelector('input')!.value);
    this.element.querySelector('button')!.innerHTML = '<i class="bi bi-check"></i>';
    ipcRenderer.send('descriptionFor', this.fileInfo);
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    this.element.querySelector('button')!.innerHTML = '<i class="bi bi-arrow-return-left"></i>';
  }
}
