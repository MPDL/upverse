import * as Validation from '../util/validation.js';

import Cmp from './base-component.js';
import { ipcRenderer } from 'electron';

import { DatasetInfo } from "../../models/dataset-info";

export class UserDataset extends Cmp<HTMLDivElement, HTMLDivElement> {
  datasetSelectElement: HTMLSelectElement;
  userDatasets: DatasetInfo[];

  constructor() {
    super('user-dataset', 'app-dataset', true, 'dest-dataset');
    this.datasetSelectElement = this.element.querySelector(
      '#dataset'
    ) as HTMLSelectElement;
    this.configure();
  }

  configure():void {
    this.element.addEventListener('change', this.changeHandler.bind(this));

    ipcRenderer.on('selectDataset', (event: Event, datasets: DatasetInfo[])  => {
      this.userDatasets = datasets;
      this.datasetSelectElement.disabled = false;
      this.datasetSelectElement.options.length = 1;
      let prevDS = "";
      datasets.forEach(dataset => {
        if (dataset.global_id !== prevDS) {
          this.datasetSelectElement.options[this.datasetSelectElement.options.length] = new Option(dataset.name, (this.datasetSelectElement.options.length - 1).toString());
          prevDS = dataset.global_id;
        }
      })
    })

  }

  renderContent():void {console.log("renderContent")}

  private gatherUserInput(): [DatasetInfo] | void {
    const enteredDataset = this.datasetSelectElement.options[this.datasetSelectElement.selectedIndex].value;
    const datasetValidatable: Validation.Validatable = {
      value: enteredDataset,
      required: true
    };

    if (
      !Validation.validate(datasetValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return [this.userDatasets[Number([enteredDataset])]];
    }
  }

  private changeHandler(event: Event) {
    event.preventDefault();
    const destDataset = this.gatherUserInput();
    if (Array.isArray(destDataset)) {
      ipcRenderer.send('datasetSelected', destDataset);
    }
  }

}
