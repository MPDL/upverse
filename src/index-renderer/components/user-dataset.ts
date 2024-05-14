import * as Validation from '../../utils/validation.js';

import Cmp from './base-component.js';
import { ipcRenderer, IpcRendererEvent } from 'electron';

import { DatasetInfo } from "../../model/dataset-info.js";

export class UserDataset extends Cmp<HTMLDivElement, HTMLDivElement> {
  datasetSelectElement: HTMLSelectElement;
  refreshButtonElement: HTMLButtonElement;
  userDatasets: DatasetInfo[];
  lastSelected: string;

  constructor() {
    super('user-dataset', 'app-dataset', true, 'dest-dataset');
    this.datasetSelectElement = this.element.querySelector(
      '#dataset'
    ) as HTMLSelectElement;
    this.refreshButtonElement = this.element.querySelector(
      '#refresh'
    ) as HTMLButtonElement;
    this.configure();
  }

  configure(): void {
    this.datasetSelectElement.addEventListener('change', this.changeHandler.bind(this));
    this.refreshButtonElement.addEventListener('click', this.refreshHandler.bind(this));

    ipcRenderer.on('DO_DS_SELECT', (event: IpcRendererEvent, datasets: DatasetInfo[]) => {
      this.userDatasets = [];
      this.datasetSelectElement.disabled = false;
      this.datasetSelectElement.options.length = 1;
      let prevDS = "";
      let isDefault: boolean = false;
      datasets.forEach(dataset => {
        if (dataset.global_id !== prevDS) {
          this.userDatasets.push(dataset);
          if (this.lastSelected && this.lastSelected === dataset.global_id) { 
            isDefault = true 
          } else {
            isDefault = false 
          };
          const option = new Option(dataset.name, (this.datasetSelectElement.options.length - 1).toString(), isDefault, isDefault );
          this.datasetSelectElement.options[this.datasetSelectElement.options.length] = option;
          prevDS = dataset.global_id;
        }
      })
    })
  }

  private gatherUserInput(): [DatasetInfo] | void {
    const enteredDataset = this.datasetSelectElement.options[this.datasetSelectElement.selectedIndex].value;
    const datasetValidatable: Validation.Validatable = {
      value: enteredDataset,
      required: true
    };

    if (
      !Validation.validate(datasetValidatable)
    ) {
      (document.getElementById("upload") as HTMLButtonElement).disabled = true;
      (document.getElementById("cancel") as HTMLButtonElement).disabled = true;  
      this.lastSelected = '';
      alert('Please, select a Dataset');
      return;
    } else {
      this.lastSelected = enteredDataset;
      const itemsSelected = document.getElementById("research-files-list") as HTMLUListElement;
      if(itemsSelected.hasChildNodes()) {
        (document.getElementById("upload") as HTMLButtonElement).disabled = false;
      }
      return [this.userDatasets[Number([enteredDataset])]];
    }
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const destDataset = this.gatherUserInput();
    if (Array.isArray(destDataset)) {
      ipcRenderer.send('DS_SELECT_DONE', destDataset);
    }
  }

  private refreshHandler(event: Event) {
    event.preventDefault();
    (document.getElementById("upload") as HTMLButtonElement).disabled = true;
    ipcRenderer.send('DO_DS_LIST_REFRESH');
  }

}
