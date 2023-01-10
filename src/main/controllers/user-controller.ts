import { getApiUser, getUserDatasets } from "../services/user-service";

import { DatasetInfo } from "../../models/dataset-info";
import { Notification } from "electron";
import { UserInfo } from "../../models/user-info";

const isDev = (process.env.isDev === 'true')

let user:UserInfo;
let datasetList:DatasetInfo[];

export const connectToRepository = async (callback: (user:UserInfo, datasetList: DatasetInfo[]) => void ): Promise<void> => {
  try {
    getApiUser((lastName:string, firstName:string) => {
      user = new UserInfo(lastName, firstName);
      getUserDatasets(user.getAuthor(), (datasetList: DatasetInfo[]) => {
        callback(user, datasetList);
      });
    })
  } catch (err) {
    new Notification({title: "Error connecting to repository", body: err});
  }

}