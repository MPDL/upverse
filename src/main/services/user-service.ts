import { getApiUser, getUserDatasets } from "../controllers/user-controller";

import { Connection } from "../../models/connection";
import { DatasetInfo } from "../../models/dataset-info";
import { UserInfo } from "../../models/user-info";

let connection:Connection;
let user:UserInfo;
let datasetList:DatasetInfo[];

export const connectToRepository = async (token: string, url: string, callback: (status: number, user:UserInfo, datasetList: DatasetInfo[]) => void ): Promise<void> => {
  connection = new Connection(url, token);
  getApiUser(connection, (lastName:string, firstName:string) => {
    user = new UserInfo(lastName, firstName);
    datasetList = [];
    getUserDatasets(connection, user.getAuthor(), datasetList, (datasetList: DatasetInfo[]) => {
      callback(connection.getStatus(), user, datasetList);
    });
  })

}