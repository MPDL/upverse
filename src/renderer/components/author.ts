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
      //console.log('\nipcRenderer.on(authenticated): \nauthor: ' + author);
      //console.log("event " + JSON.stringify(event));
      this.authorElement.innerHTML = ` ${author} <i class="bi bi-person-check text-info"></i>`;
    })

    ipcRenderer.on('failed', (event: Event, msg: string)  => {
      //console.log('\nipcRenderer.on(failed): \nmsg: ' + msg);
      //console.log("event " + JSON.stringify(event));
      this.authorElement.innerHTML = ` ${msg} <i class="bi bi-person-check text-warning"></i>`;
    })

  }
}