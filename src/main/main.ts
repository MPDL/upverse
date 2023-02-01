import * as path from "path";

import { BrowserWindow, IpcMainEvent, Menu, Notification, app, ipcMain } from "electron";

import { DatasetInfo } from "../models/dataset-info";
import { FileInfo } from "../models/file-info";
import { Settings } from "./settings";
import { connectToRepository } from "./controllers/user-controller";
import { transfer_direct_from_file } from './controllers/upload-controller';

// Set env
process.env.isDev = 'false';
const isDev = (process.env.isDev === 'true');

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: "Research Data Files Uploader",
    width: 1400,
    height: 900,
    webPreferences: {
      // webSecurity: true,      
      nodeIntegration: true,
      preload: path.join(__dirname, "../renderer/preload.js"),
    },
    resizable: false
  });

  mainWindow.loadURL(`file://${__dirname}/../../index.html`);

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.getName(),
        submenu: [
          {
            label: 'Save',
            click() {
              if (isDev) console.log("save");
              Settings.save();
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

  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}

app.on("ready", () => {
  new Settings();
  createWindow();
  createMenu();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on('doConnection', (event: IpcMainEvent, givenSettings: string[]) => {
  try {
    process.env.admin_api_key = givenSettings[0];
    process.env.dv_base_uri = givenSettings[1];
    connectToRepository((user, datasetList) => {
      if( Settings.settingsData.getStatus() == 200 ) {
        event.reply('authenticated', [user.getAuthor()]); 
        event.reply('selectDataset', datasetList); 
      }
    });
  } catch (error) {
    console.log('connectionFailed');
    new Notification({ title: 'Connect', body: 'Connection failed'});
    event.reply('failed', ['Connection failed']); 
  }
})

ipcMain.on('datasetSelected', (event: IpcMainEvent, dataset: [DatasetInfo]) => {
  if (process.env.dest_dataset !== dataset[0].global_id) {
    process.env.dest_dataset = dataset[0].global_id;
    process.env.files_loaded = dataset[0].fileCount.toString();
  }
  event.reply('selectFiles', '~', Number(process.env.files_loaded));
})

ipcMain.on('filesSelected', (event: IpcMainEvent, files: FileInfo[]) => {
  event.reply('selectedFiles', files);

  transfer_files(event, process.env.dest_dataset, files);
})

ipcMain.on('removeItem', (event: IpcMainEvent, file: FileInfo)  => {
  event.reply('removeItem', file);
})

ipcMain.on('filesCleared', (event: IpcMainEvent) => {
  event.reply('clearFiles');
})

const transfer_files = async (event: IpcMainEvent, persistentId: string, files: FileInfo[]): Promise<void> => {
  try {
    const result:Record<string, unknown> = await transfer_direct_from_file(event, persistentId, files);
    process.env.files_loaded = (Number(process.env.files_loaded) + Number(result.numFilesUploaded)).toString();
    event.reply('end', result);
  } catch (error) {
    console.error(error);
    new Notification({ title: 'Upload Failed!', body: error }).show();
    event.reply('abort', ''); 
  }
}