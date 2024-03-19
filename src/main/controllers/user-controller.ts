import { getMyUser, getMyDatasetsPage } from "../services/user-service";
import { DatasetInfo } from "../../model/dataset-info";
import { UserInfo } from "../../model/user-info";
import { User, Datasets, Item } from "../interfaces/repository-interface";

export const connectToRepository = () => {
  return new Promise<UserInfo>(
    async (
      resolve: (values: UserInfo) => void,
      reject: (error: Error) => void
    ) => {
      try {
        await getMyUser().then((responseBody: User) => {
          const user: UserInfo = new UserInfo(responseBody.data.lastName, responseBody.data.firstName);
          resolve(user);
        }).catch(error => {
          reject(error);
        });
      } catch (err) {
        reject(err);
      }
    })
}

export const getUserDatasets = () => {
  return new Promise<DatasetInfo[]>(
    async (
      resolve: (values: DatasetInfo[]) => void,
      reject: (error: Error) => void
    ) => {
      let selectedPage = 0;
      let nextPage = 0;
      let datasetList: DatasetInfo[] = [];

      try {
        do {
          selectedPage++;
          await getMyDatasetsPage(selectedPage).then((responseBody: Datasets) => {
            responseBody.data.items.forEach((item: Item) => {
              const datasetInfo = new DatasetInfo(item.name, item.global_id, item.fileCount);
              datasetList.push(Object.assign({}, datasetInfo));
            })
            nextPage = responseBody.data.pagination.nextPageNumber;
          }).catch(error => {
            reject(error);
          });
        } while (selectedPage < nextPage);
        resolve(datasetList);
      } catch (err) {
        reject(err);
      }
    })
}