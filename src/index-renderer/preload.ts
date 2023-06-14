import { Author } from './components/author.js';
import { DataFileList } from './components/data-file-list.js';
import { DataFilesInput } from './components/data-files-input.js';
import { UserDataset } from './components/user-dataset.js';

window.addEventListener("DOMContentLoaded", () => {
  new Author();
  new UserDataset();
  new DataFilesInput();
  new DataFileList();
});
