import Cmp from './base-component.js';
import { FileInfo } from "../../models/file-info";
import { FileItem } from './file-item';
import { dataFiles } from '../data-files';
import { ipcRenderer } from 'electron';

export class DataFileList extends Cmp<HTMLDivElement, HTMLDivElement> {
  fileListElement: HTMLUListElement;
  selectedFiles: FileInfo[];

  constructor() {
    super('data-file-list', 'app-file-list', true, 'file2upload-list');
    this.fileListElement = this.element.querySelector(
      '#file-list'
    ) as HTMLUListElement;
    this.selectedFiles = [];

    this.configure();
    this.renderHeader();
  }

  configure():void {
      dataFiles.addListener((files: FileInfo[]) => {
        this.selectedFiles = files;
        this.renderItems();
      });

      ipcRenderer.on('descriptionFor', (event: Event, file: FileInfo)  => {
        console.log('\nipcRenderer.on(descriptionFor): \nfile: ' + JSON.stringify(file));
        dataFiles.updateDataFile(file);
      })

      ipcRenderer.on('done', (event: Event, dummy: string)  => {
        dataFiles.clear();
        this.element.querySelector('ul')!.innerHTML = '';
        console.log('\nipcRenderer.on(done): \nfiles: ' + dataFiles.getAll().length);
      })    
  }

  renderHeader():void {
    const listId = 'research-files-list';
    this.element.querySelector('ul')!.id = listId;
  }

  private renderItems() {
    const listEl = document.getElementById(
      'research-files-list'
    )! as HTMLUListElement;
    listEl.innerHTML = '';
    for (const fileInfo of this.selectedFiles) {
      new FileItem(this.element.querySelector('ul')!.id, fileInfo);
    }
  }

}
