import Cmp from './base-component.js';
import { ipcRenderer } from 'electron';

export class Author extends Cmp<HTMLDivElement, HTMLDivElement> {
  authorElement: HTMLSpanElement;

  constructor() {
    super('user-author', 'app-author', true, 'CONN_SUCCESS');
    this.authorElement = this.element.querySelector(
      '#author'
    ) as HTMLSpanElement;
    this.configure();
  }

  configure():void {
    ipcRenderer.on('CONN_SUCCESS', (event: Event, author: string)  => {
      this.authorElement.innerHTML = `<em>Connected as </em><strong>${author} </strong><i class="bi bi-person-check text-info"></i>`;
    })

    ipcRenderer.on('CONN_FAILED', (event: Event, msg: string)  => {
      this.authorElement.innerHTML = `${msg} <i class="bi bi-person-check text-warning"></i>`;
    })
  }
  
}