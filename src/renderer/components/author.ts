import Cmp from './base-component.js';
import { ipcRenderer } from 'electron';

export class Author extends Cmp<HTMLDivElement, HTMLDivElement> {
  authorElement: HTMLSpanElement;

  constructor() {
    super('user-author', 'app-author', true, 'authenticated');
    this.authorElement = this.element.querySelector(
      '#author'
    ) as HTMLSpanElement;
    this.configure();
  }

  configure():void {

    ipcRenderer.on('authenticated', (event: Event, author: string)  => {
      this.authorElement.innerHTML = `<em>Connected as </em><strong>${author} </strong><i class="bi bi-person-check text-info"></i>`;
    })

    ipcRenderer.on('failed', (event: Event, msg: string)  => {
      this.authorElement.innerHTML = `${msg} <i class="bi bi-person-check text-warning"></i>`;
    })

  }
}