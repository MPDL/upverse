import * as Validation from '../util/validation.js';

import Cmp from './base-component.js';
import { ipcRenderer } from 'electron';

// ProjectInput Class
export class ApiConnection extends Cmp<HTMLDivElement, HTMLFormElement> {
  tokenInputElement: HTMLInputElement;
  urlInputElement: HTMLInputElement;

  constructor() {
    super('api-connection', 'app-connection', true, 'api-settings');
    this.tokenInputElement = this.element.querySelector(
      '#token'
    ) as HTMLInputElement;
    this.urlInputElement = this.element.querySelector(
      '#url'
    ) as HTMLInputElement;
    this.configure();
  }

  configure():void {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
  }

  renderContent():void {console.log("renderContent")}

  private gatherUserInput(): [string, string] | void {
    const enteredToken = this.tokenInputElement.value;
    const enteredUrl = this.urlInputElement.value;

    const tokenValidatable: Validation.Validatable = {
      value: enteredToken,
      required: true,
      minLength: 30
    };
    const urlValidatable: Validation.Validatable = {
      value: enteredUrl,
      required: true,
      minLength: 30
    };

    if (
      !Validation.validate(tokenValidatable) ||
      !Validation.validate(urlValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return [enteredToken, enteredUrl];
    }
  }
/*
  private clearInputs() {
    this.tokenInputElement.value = '';
    this.urlInputElement.value = '';
  }
*/

  private submitHandler(event: Event) {
    event.preventDefault();
    const apiSettings = this.gatherUserInput();
    if (Array.isArray(apiSettings)) {
      //const [token, url] = apiSettings;
      //this.clearInputs();
      // check connection and load user and his datasets
      //console.log('\nipcRenderer.send(doConnection): \napiSettings: '+apiSettings);
      ipcRenderer.send('doConnection', apiSettings);

    }
  }
}
