import * as path from "path";

import { BrowserWindow, IpcMainEvent, Menu, app, ipcMain } from "electron";

import { FileInfo } from "../models/file-info";
import { connectToRepository } from "./services/user-service";
import { transfer_direct_from_file } from './services/upload-service';

// Set env
process.env.NODE_ENV = 'development'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: "Data Uploader",
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "../renderer/preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../../index.html"));

  // Open the DevTools.

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }
}

function createMenu() {
  // Create main app menu
  const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.getName(),
        submenu: [
          {
            role: 'about',
          },
          {
            label: 'Save',
            click() {
              console.log("save");
            }
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Developer',
        submenu: [{
          role: 'reload'
        },
        {
          role: 'forceReload'
        },
        {
          type: 'separator'
        },
        {
          role: 'toggleDevTools'
        },
        ]
      }
  ];

  // Build menu
  const menu = Menu.buildFromTemplate(template);

  // Set as main app menu
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  createMenu();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on('doConnection', (event: IpcMainEvent, givenSettings: string[]) => {
  //console.log('\nipcMain.on(doConnect): \ngivenSettings: ' + givenSettings);
  try {
    connectToRepository(givenSettings[0], givenSettings[1], (status, user, datasetList) => {
      if( status == 200 ) {
        process.env.admin_api_key = givenSettings[0];
        process.env.dv_base_uri = givenSettings[1];
        event.reply('authenticated', [user.getAuthor()]); 
        event.reply('selectDataset', datasetList); 
      }
    });
  } catch (error) {
    // connectionFailed
  }
})

ipcMain.on('datasetSelected', (event: IpcMainEvent, persistentId: string) => {
  //console.log('\nipcMain.on(datasetSelected): \ndataset: ' + persistentId);
  process.env.dest_dataset = persistentId;
  event.reply('selectFiles', '~/Downloads');
})

ipcMain.on('filesSelected', (event: IpcMainEvent, files: FileInfo[]) => {
  //console.log('\nipcMain.on(filesSelected): \nfiles: ' + JSON.stringify(files));
  event.reply('selectedFiles', files);
  transfer_files(process.env.dest_dataset, files);
})

const transfer_files = async (persistentId: string, files: FileInfo[]): Promise<void> => {
  try {
    const result = await transfer_direct_from_file(persistentId, files);
    //console.log("\nresult: " + result.number_of_files);
  } catch (error) {
    console.error(error);
  }
}