# UpVerse User Manual
UpVerse is the desktop application that allows you to upload files from your local device to the Edmond repository using a graphical interface. This short manual is intended to guide you through the process of installing and uploading your first files on Windows. The whole process is also visualised in a screencast.
## Installation
The latest version of Upverse can be found in the [Github repository](https://github.com/MPDL/upverse). The download file can be found by clicking on the latest release in the "Releases" tab on the right. The file contains versions of UpVerse for different operating systems. Selecting the appropriate system starts the download in your browser.
## Setting the API token and repository link
Once you have finished downloading and opened Upverse, you need to enter the API ("Application Programming Interface") token for the user. The API token for your account can be found on Edmond. After logging into your Edmond account, open the Account tab in the top right corner. There you will find "API Token" where the token is created.

![](https://pad.gwdg.de/uploads/ae4e78fe-5794-4009-83f9-5b8299c07f82.png)


The generated token can now be copied to Upverse. More information about the API can be found in the [Dataverse documentation](https://guides.dataverse.org/en/latest/api/).

As well as your personal token, you also need to include the repository URL. Copy the following into the field: https://edmond.mpdl.mpg.de. You can then save the information and close the window. If you ever want to change the token, it's always possible to reopen the settings window under **Settings** in the **UpVerse** tab at the top left in the main window.
## Uploading files
In order to upload files and data to your repository, open the main window. 

![](https://pad.gwdg.de/uploads/a4fcebd9-0806-4fde-b62b-85c8a56f8dbb.png)

Under **Files** or **Folders** you can select either individual files or entire folders from your local memory. All selected files are listed one after the other. You can then edit the metadata to your liking, such as adding a description to your data (**1**), changing the name of your file (**2**) or excluding it from the upload (**3**).

![](https://pad.gwdg.de/uploads/68094b2c-46f6-4735-afc5-483cf45a3928.png)

You can also delete all files by selecting **Clear**. Once you have decided which files to add to the repository, select your target dataset. This is useful if you have more than one dataset ready to publish. If you can't find the dataset you want, or you forgot to create one for the files, go to Edmond and double check your dataset, or create a new one. On the main page of Edmond, select **Add Data** and then **New Dataset**. Fill in the mandatory fields, which are

* Title of the Dataset
* Author
* MPG institution to which you belong
* Study type of your Dataset

and save the Dataset. The Dataset can then be accessed by clicking on the reload icon in the UpVerse window. 

The files can now be uploaded to the repository (**Upload** icon). If, during the upload process, you change your mind about the files you want to upload, you can press the **Cancel** button at any time to prevent the files from being uploaded. All files are then immediately deleted and you are able to select and edit new files. 

The files can then be found in your dataset in Edmond on your web browser.