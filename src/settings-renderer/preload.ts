// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { ApiConnection } from './components/api-connection.js';

window.addEventListener("DOMContentLoaded", () => {
  new ApiConnection();
});
