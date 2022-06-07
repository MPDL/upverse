import { Notification, app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { Connection } from "../models/connection";
import path from "path";

const isDev = (process.env.isDev === 'true')

export class Settings {
  static settingsPath: string;
  static settingsData: Connection = new Connection();

  constructor() {
    const userData = app.getPath("userData");
    if (isDev) console.log("userData: " + userData);
    Settings.settingsPath = path.join(userData, "upverseSettings.json");
    if (isDev) console.log("Store.settingsPath: " + Settings.settingsPath);
    try {
      if (existsSync(Settings.settingsPath)) {
        Settings.settingsData = Object.assign(new Connection(), JSON.parse(readFileSync(Settings.settingsPath,{encoding:'utf8', flag:'r'})));
        process.env.admin_api_key = Settings.settingsData.getToken();
        process.env.dv_base_uri = Settings.settingsData.getUrl();
      } else {
        process.env.admin_api_key = "";
        process.env.dv_base_uri = "";
      }
    } catch (err) {
        if (isDev) console.log('Error reading settings ' + err);
        console.log('Error reading settings ' + err);
        new Notification({title: 'save', body: 'Error reading settings'});
    }
  }

  static save():void {
    try {
      if (isDev) console.log("save() : Store.settingsPath " + Settings.settingsPath);
      Settings.settingsData.setToken(process.env.admin_api_key);
      Settings.settingsData.setUrl(process.env.dv_base_uri);      
      writeFileSync(Settings.settingsPath, JSON.stringify(Settings.settingsData, null, 2), 'utf8');
      if (isDev) console.log('Settings successfully saved to disk');
      new Notification({title: 'save', body: 'Settings successfully saved to disk'});
    } catch (err) {
      if (isDev) console.log('Error saving settings ', err);
      console.log('Error saving settings ', err);
      new Notification({title: 'save', body: 'Error saving settings '});
    }
  }
}