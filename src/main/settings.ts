import { app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { Connection } from "../model/connection";
import path from "path";

export class Settings {
  static settingsPath: string;
  static settingsData: Connection = new Connection();

  constructor() {
    const userData = app.getPath("userData");
    Settings.settingsPath = path.join(userData, "upverseSettings.json");
  }

  static save(): boolean {
    try {
      Settings.settingsData.setToken(process.env.admin_api_key);
      Settings.settingsData.setUrl(process.env.dv_base_uri);
      writeFileSync(Settings.settingsPath, JSON.stringify(Settings.settingsData, null, 2), 'utf8');
      return true;
    } catch (err) {
      return false;
    }
  }

  static existSettings(): boolean {
    if (existsSync(Settings.settingsPath)) {
      return true;
    }
    return false;
  }

  static loadSettings(): boolean {
    try {
      if (existsSync(Settings.settingsPath)) {
        Settings.settingsData = Object.assign(new Connection(), JSON.parse(readFileSync(Settings.settingsPath, { encoding: 'utf8', flag: 'r' })));
        process.env.admin_api_key = Settings.settingsData.getToken();
        process.env.dv_base_uri = Settings.settingsData.getUrl();
        return true;
      } else {
        process.env.admin_api_key = "";
        process.env.dv_base_uri = ""; 
        return false;       
      }
    } catch (err) {
      throw err;
    }  
  }
}