import { Notification, app } from "electron";
import { readFileSync, writeFileSync } from "fs";

import { Connection } from "../models/connection";
import path from "path";

const isDev = (process.env.isDev === 'true')

export class Store {
  static settingsPath: string;
  static settingsData: Connection;

  constructor() {
    const userData = app.getPath("userData");
    Store.settingsPath = path.join(userData, "upverseSettings.json");
    try {
      Store.settingsData = JSON.parse(readFileSync(Store.settingsPath,
      {encoding:'utf8', flag:'r'}));
      process.env.admin_api_key = Store.settingsData.getToken();
      process.env.dv_base_uri = Store.settingsData.getUrl();
    } catch (err) {
      Store.settingsData = new Connection(
        process.env.admin_api_key = '997095e5-2910-4ccf-a920-e4f6f00fa3a3', 
        process.env.dv_base_uri = 'https://dev-edmond2.mpdl.mpg.de/api'
      );
      Store.save();
    }
  }

  static save():void {
    try {
      Store.settingsData.setToken(process.env.admin_api_key);
      Store.settingsData.setUrl(process.env.dv_base_uri);      
      writeFileSync(Store.settingsPath, JSON.stringify(Store.settingsData, null, 2), 'utf8');
      if (isDev) console.log('Settings successfully saved to disk');
      new Notification({title: 'save', body: 'Settings successfully saved to disk'});
    } catch (error) {
      if (isDev) console.log('An error saving settings has occurred ', error);
      new Notification({title: 'save', body: 'An error saving settings has occurred'});
    }
  }
}