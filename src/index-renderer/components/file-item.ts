import * as Validation from '../../utils/validation.js';

import Cmp from './base-component';
import { FileInfo } from '../../model/file-info.js';
import { ipcRenderer } from 'electron';

export class FileItem extends Cmp<HTMLUListElement, HTMLFormElement>
{
  private fileInfo: FileInfo;
  fileListElement: HTMLUListElement;
  descriptionElement: HTMLInputElement;
  relativePathElement: HTMLInputElement;
  actionsElement: HTMLDivElement;
  removeButtonElement: HTMLButtonElement;

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

    this.configure();+
    this.renderContent();
  }

  configure(): void {
    this.element.addEventListener('change', this.changeHandler.bind(this));
    this.removeButtonElement.addEventListener('click', this.removeHandler.bind(this));

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

  private gatherUserInput(): [ string, string ] | void {
    const description = this.descriptionElement.value;
    const relativePath = this.relativePathElement.value;

    if (relativePath.length != 0) {
    const relativePathValidatable: Validation.Validatable = {
      value: relativePath,
      required: false,
      regexp: /^[\/]{0,1}(?:[.\/](?![.\/])|[^<>:"!|?*.\/\\ \n])+$/g
    };

    if (
      !Validation.validate(relativePathValidatable)
    ) {
      alert("Invalid input. \nDirectory Name cannot contain invalid characters. \nValid characters are a-Z, 0-9, '_', '-', '.', '\', '/' and ' ' (white space).");
      this.relativePathElement.value = this.fileInfo.relativePath;
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


}
