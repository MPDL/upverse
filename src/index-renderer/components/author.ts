import Cmp from './base-component.js';
import { ipcRenderer, shell } from 'electron';

export class Author extends Cmp<HTMLDivElement, HTMLDivElement> {
  authorElement: HTMLSpanElement;
  logoLinkElement: HTMLLinkElement;
  siteLinkElement: HTMLLinkElement;

  constructor() {
    super('user-author', 'app-author', true, 'author-info');
    this.authorElement = this.element.querySelector(
      '#author'
    ) as HTMLSpanElement;
    this.logoLinkElement = document.getElementById(
      'repo'
    ) as HTMLLinkElement;
    this.siteLinkElement = document.getElementById(
      'site'
    ) as HTMLLinkElement;

    this.configure();
  }

  configure(): void {
    this.logoLinkElement.addEventListener('click', this.logoHandler.bind(this)); 
    this.siteLinkElement.addEventListener('click', this.siteHandler.bind(this)); 

    ipcRenderer.on('CONN_SUCCESS', (event: Event, author: string, repository: string)  => {
      this.authorElement.innerHTML = `<em>Connected as </em><strong>${author} </strong><i class="bi bi-person-check text-info"></i>`;
      this.logoLinkElement.href = repository;
    })

    ipcRenderer.on('CONN_FAILED', (event: Event, msg: string)  => {
      this.authorElement.innerHTML = `${msg} <i class="bi bi-person-check text-warning"></i>`;
    })
  }
  
  private logoHandler(event: Event) {
    event.preventDefault();

    shell.openExternal(this.logoLinkElement.href); 
  }

  private siteHandler(event: Event) {
    event.preventDefault();

    shell.openExternal(this.siteLinkElement.href); 
  }
  
}