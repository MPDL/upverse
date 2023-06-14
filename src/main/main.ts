import * as path from "path";
import * as fs from 'fs';
import * as mime from 'mime-types';
import { netLog, Menu, Notification, dialog, BrowserWindow, IpcMainEvent, ipcMain, app } from "electron";

import { DatasetInfo } from "../model/dataset-info";
import { FileInfo } from "../model/file-info";
import { Settings } from "./settings";
import { connectToRepository, getUserDatasets } from "./controllers/user-controller";
import * as upload_controller from './controllers/upload-controller';
import { UserInfo } from "../model/user-info";

if (require('electron-squirrel-startup')) app.quit();
// Set env
const isDev = false;

let mainWindow: BrowserWindow;
let settingsWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Research Data Uploader",
    width: 1600,
    height: 800,
    webPreferences: {
      // webSecurity: true,      
      nodeIntegration: true,
      preload: path.join(__dirname, "../index-renderer/preload.js")
    },
    // resizable: false,
    center: true,
    maximizable: true,
    icon: path.join(__dirname, "../../../assets/favicons/edmond_favicon_red.png")
  });

  const indexPath = path.join('file://', __dirname, '../../views/index.html')
  mainWindow.loadURL(indexPath);

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', function () {
    app.quit();
  })
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.getName().charAt(0).toUpperCase() + app.getName().slice(1),
      submenu: [
        {
          label: 'Settings',
          click() {
            if (isDev) console.log("on settings menu");
            const settingsPath = path.join('file://', __dirname, '../../views/settings.html')
            settingsWindow = new BrowserWindow({
              width: 800,
              height: 360,
              // resizable: false,
              title: "Settings",
              webPreferences: {
                // webSecurity: true,      
                nodeIntegration: true,
                preload: path.join(__dirname, "../settings-renderer/preload.js")
              },
              center: true
              /*, frame: false*/
            })
            settingsWindow.setMenu(null);
            settingsWindow.loadURL(settingsPath);
            settingsWindow.show();

            // Open the DevTools.
            if (isDev) {
              settingsWindow.webContents.openDevTools();
            }
          }
        },

        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}

app.on("ready", () => {
  createWindow();
  createMenu();

  const userData = app.getPath("userData");
  netLog.startLogging(path.join(userData, "net-log"));

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    try {
      new Settings();
      if (Settings.loadSettings()) {
        new Notification({ title: 'Upverse', body: 'Settings successfully read' }).show();
        await doConnection().then( async (user: UserInfo) => {
          mainWindow.webContents.send('CONN_SUCCESS', [user.getAuthor()]);
          await getDatasets().then((datasetList: DatasetInfo[]) => {
            mainWindow.webContents.send('DO_DS_SELECT', datasetList);
          }).catch(error => {
            throw error;
          });
        }).catch(error => {
          mainWindow.webContents.send('CONN_FAILED', error.message);
          throw error;
        });
      } else throw new Error('Please, set your Settings');
    } catch (err) {
      if (isDev) console.error(err);
      new Notification({ title: 'Upverse', body: err.message }).show();
    }
  });

});

app.on("window-all-closed", () => {
  netLog.stopLogging();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on('DO_TEST_CONN', async (event: IpcMainEvent, givenSettings: string[]) => {
  try {
    if (givenSettings != null && givenSettings.length == 2) {
      process.env.admin_api_key = givenSettings[0];
      process.env.dv_base_uri = givenSettings[1];

      await doConnection().then( async (user: UserInfo) => {
        event.reply('TEST_CONN_SUCCESS');
        mainWindow.webContents.send('CONN_SUCCESS', [user.getAuthor()]);
        await getDatasets().then((datasetList: DatasetInfo[]) => {
          mainWindow.webContents.send('DO_DS_SELECT', datasetList);
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        event.reply('TEST_CONN_FAILED');
        throw error;
      });
    } else throw new Error('Please, check Settings');
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'Settings', body: error.message }).show();
  }
})

ipcMain.on('DO_SAVE_SETTINGS', (event: IpcMainEvent, givenSettings: string[]) => {
  try {
    if (givenSettings != null && givenSettings.length == 2) {
      process.env.admin_api_key = givenSettings[0];
      process.env.dv_base_uri = givenSettings[1];
      if (Settings.save()) {
        event.reply('SAVE_SETTINGS_SUCCESS');
        new Notification({ title: 'Upverse', body: 'Settings successfully saved to disk' }).show();

      } else {
        event.reply('SAVE_SETTINGS_FAILED');
        new Notification({ title: 'Upverse', body: 'Error saving settings ' }).show();
      }
    } else throw new Error('Please, enter values');
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'Settings', body: error.message }).show();
  }
})

ipcMain.on('DS_SELECT_DONE', (event: IpcMainEvent, dataset: [DatasetInfo]) => {
  if (process.env.dest_dataset !== dataset[0].global_id) {
    process.env.dest_dataset = dataset[0].global_id;
    process.env.files_loaded = dataset[0].fileCount.toString();
  }
})

ipcMain.on('DO_DS_LIST_REFRESH', async (event: IpcMainEvent) => {
  try {
    await getDatasets().then((datasetList: DatasetInfo[]) => {
      mainWindow.webContents.send('DO_DS_SELECT', datasetList);
    });
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'Upverse', body: error.message }).show();
  }
})

ipcMain.on('DO_FILE_EXCLUDE', (event: IpcMainEvent, file: FileInfo) => {
  event.reply('DO_FILE_CLEAR', file);
})

ipcMain.on('DO_CLEAR_SELECTED', (event: IpcMainEvent) => {
  event.reply('DO_LIST_CLEAR');
})

ipcMain.on('DO_FILE_SELECT', (event: IpcMainEvent) => {
  try {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'], buttonLabel: "Select"
    }).then(async result => {
      let fileInfoList: FileInfo[] = [];
      for (const file of result.filePaths) {
        fileInfoList.push(getFileInfo(file, fileInfoList.length));
      }
      if (fileInfoList.length) event.reply('FILE_SELECT_DONE', fileInfoList);
    });
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'File Explorer', body: 'Open file explorer failed' });
    event.reply('FILE_SELECT_FAILED', '');
  }
})

ipcMain.on('DO_FOLDER_SELECT', (event: IpcMainEvent) => {
  try {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'], buttonLabel: "Select"
    }).then(async result => {
      let fileList: string[] = [];
      for (const filePath of result.filePaths) {
        for (const files of getFileList(filePath)) {
          fileList = fileList.concat(files);
        }
      }
      let fileInfoList: FileInfo[] = [];
      const currentBasePath = path.basename(result.filePaths[0]);

      for (const file of fileList) {
        let uploadPath = path.dirname(path.relative(result.filePaths[0], file));
        uploadPath = path.join(currentBasePath, uploadPath);
        fileInfoList.push(getFileInfo(file, fileInfoList.length, uploadPath));
      }
      if (fileInfoList.length) event.reply('FOLDER_SELECT_DONE', fileInfoList);
    });
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'File Explorer', body: 'Open file explorer failed' });
    event.reply('FOLDER_SELECT_FAILED', '');
  }

})

ipcMain.on('DO_UPLOAD', async (event: IpcMainEvent, fileInfoList: FileInfo[]) => {
  if (!fileInfoList.length) {
    new Notification({ title: 'Upload Failed!', body: 'Nothing selected to Upload' }).show();
  } else if (!process.env.dest_dataset) {
    new Notification({ title: 'Upload Failed!', body: 'No destination Dataset selected' }).show();
  } else {
    try {
      await transferFiles(event, process.env.dest_dataset, fileInfoList).then((result: Record<string, unknown>) => {
        event.reply('UPLOAD_DONE', result);
      }).catch(error => {
        event.reply('UPLOAD_FAILED', error.message);
        throw error;
      })
    } catch (error) {
      if (isDev) console.error(error);
      new Notification({ title: 'Upload Failed!', body: error.message }).show();
    }
  }
});

ipcMain.on('DO_ABORT', (event: IpcMainEvent) => {
  try {
    upload_controller.setAbort.subscribe();
    event.reply('UPLOAD_ABORT', '');
  } catch (error) {
    if (isDev) console.error(error);
    new Notification({ title: 'Upload', body: 'Upload aborted' });
    event.reply('UPLOAD_FAILED', '');
  }
});

const transferFiles = (event: IpcMainEvent, persistentId: string, files: FileInfo[]) => {
  return new Promise<Record<string, unknown>>(
    async (
      resolve: (values: Record<string, unknown>) => void,
      reject: (error: Error) => void
    ) => {
      try {
        await upload_controller.filesTransfer(event, persistentId, files).then((result: Record<string, unknown>) => {
          process.env.files_loaded = (Number(process.env.files_loaded) + Number(result.numFilesUploaded)).toString();
          resolve(result);
        }).catch(error => {
          reject(error);
        })
      } catch (err) {
        if (isDev) console.error(err);
        reject(err);
      }
    }
  )
}

const doConnection = () => {
  return new Promise<UserInfo>(
    async (
      resolve: (values: UserInfo) => void,
      reject: (error: Error) => void
    ) => {
      try {
        await connectToRepository().then((user: UserInfo) => {
          resolve(user);
        }).catch(error => {
          reject(error);
        });
      } catch (err) {
        if (isDev) console.error(err);
        reject(err);
      }
    }
  )
};

const getDatasets = () => {
  return new Promise<DatasetInfo[]>(
    async (
      resolve: (values: DatasetInfo[]) => void,
      reject: (error: Error) => void
    ) => {
      try {
        await getUserDatasets().then((datasetList) => {
          resolve(datasetList);
         }).catch(error => {
          reject(error);
        });
      } catch (err) {
        if (isDev) console.error(err);
        reject(err);
      }
    }
  )
}

const getFileList = (path: string) => {
  let tree: string[] = [];
  const items = fs.readdirSync(path, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      tree = [...tree, ...getFileList(`${path}/${item.name}`)];
    } else {
      tree.push(`${path}/${item.name}`);
    }
  }

  return tree;
};

const getFileInfo = (file: string, id: number, uploadPath?: string): FileInfo => {
  var stats = fs.statSync(file);
  return new FileInfo(
    id,
    path.basename(file),
    file,
    uploadPath ? uploadPath : '',
    stats["size"],
    (mime.lookup(file) ? mime.lookup(file) : 'application/octet-stream').toString(),
    new Date(stats.mtime)
  );
};
