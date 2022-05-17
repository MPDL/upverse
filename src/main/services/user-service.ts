import { getApiUser, getUserDatasets } from "../controllers/user-controller";

import { Connection } from "../../models/connection";
import { DatasetInfo } from "../../models/dataset-info";
import { Notification } from "electron";
import { UserInfo } from "../../models/user-info";

const isDev = (process.env.isDev === 'true')

let connection:Connection;
let user:UserInfo;
let datasetList:DatasetInfo[];

export const connectToRepository = async (token: string, url: string, callback: (status: number, user:UserInfo, datasetList: DatasetInfo[]) => void ): Promise<void> => {
  try {
    connection = new Connection(url, token);
    getApiUser(connection, (lastName:string, firstName:string) => {
      user = new UserInfo(lastName, firstName);
      datasetList = [];
      getUserDatasets(connection, user.getAuthor(), datasetList, (datasetList: DatasetInfo[]) => {
        callback(connection.getStatus(), user, datasetList);
      });
    })
  } catch (err) {
    new Notification({title: "Error connecting to repository", body: err});
  }

}