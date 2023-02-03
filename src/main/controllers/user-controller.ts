import { getApiUser, getDatasetsPage } from "../services/user-service";

import { DatasetInfo } from "../../models/dataset-info";
import { Notification } from "electron";
import { UserInfo } from "../../models/user-info";

const isDev = (process.env.isDev === 'true')

export const connectToRepository = async (callback: (user:UserInfo, datasetList: DatasetInfo[]) => void ): Promise<void> => {
  try {
    let user:UserInfo;
    let datasetList:DatasetInfo[];

    const getMeResponseBody = await getApiUser();
    user = new UserInfo(getMeResponseBody.data.lastName, getMeResponseBody.data.firstName);
    datasetList = await getUserDatasets();
    callback(user, datasetList);
  } catch (err) {
    new Notification({ title: "Error connecting to repository", body: err });
  }
} 

const getUserDatasets = async (): Promise<DatasetInfo[]> => {
  return new Promise<DatasetInfo[]>(
      async (
          resolve: (values: DatasetInfo[]) => void,
          reject: (error: Error) => void
      ) => {
    try {
      let selectedPage = 0;
      let nextPage;
      let datasetList:DatasetInfo[] = [];
      do {
        selectedPage++;
          console.log("do.selectedPage: " + selectedPage);
          const getDatasetsPageResponseBody = await getDatasetsPage(selectedPage);
          
          /*, (nextPageNumber, datasetPage) => {
            if (nextPageNumber > selectedPage) {
              selectedPage = nextPageNumber;
              console.log("do.datasetPage.length: " + datasetPage.length);
              datasetList = datasetList.concat(datasetPage);
              console.log("do.datasetList.length: " + datasetList.length);
            //} else {
              //console.log("callback.datasetList.length: " + datasetList.length);
              resolve(datasetList);
            }
          });
          */

          //nextPageNumber = getDatasetsPageResponseBody.data.pagination.nextPageNumber;
                    
          getDatasetsPageResponseBody.data.items.forEach((item: {name:string, global_id:string, fileCount:number}) => {
              const datasetInfo = new DatasetInfo(item.name, item.global_id, item.fileCount);                        
              datasetList.push(Object.assign({}, datasetInfo));   
              console.log(JSON.stringify(datasetInfo));                                     
          })
          nextPage = getDatasetsPageResponseBody.data.pagination.nextPageNumber;
      } while(selectedPage < nextPage); 
      resolve(datasetList);
    } catch (err) {
      new Notification({title: "Error connecting to repository", body: err});
    }
  })
}
