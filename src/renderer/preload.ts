// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { ApiConnection } from './components/api-connection.js';
import { Author } from './components/author.js';
import { DataFileList } from './components/data-file-list.js';
import { DataFilesInput } from './components/data-files-input.js';
import { UserDataset } from './components/user-dataset.js';

window.addEventListener("DOMContentLoaded", () => {
  new Author();
  new ApiConnection();
  new UserDataset();
  new DataFilesInput();
  new DataFileList();
});
