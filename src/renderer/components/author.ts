import Cmp from './base-component.js';
import { ipcRenderer } from 'electron';

// ProjectInput Class
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
      this.authorElement.innerHTML = `<i class="bi bi-person-check text-success"> ${author}</i>`;
    })

    ipcRenderer.on('failed', (event: Event, msg: string)  => {
      //console.log('\nipcRenderer.on(failed): \nmsg: ' + msg);
      //console.log("event " + JSON.stringify(event));
      this.authorElement.innerHTML = `<i class="bi bi-person-check text-warning"> ${msg}</i>`;
    })

  }
}