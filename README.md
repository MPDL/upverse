MPDL Collections

# Edmond research data uploader

## Installation

    **npm install**


## Previous

To prepare, log in to Edmond and:

    find the DOI for the dataset you wish to add files to, and
    find or generate an API key for yourself in the Dataverse instance you are using (from the popup menu under your profile).

## Run upload app

    **npm start**


## Requirement	Description
	
Must run on different operating systems	 (Windows, Unix, Mac)

	
### API Calls	
    - Get user info
    - Get user dataset list	
    - Requesting Direct Upload of a DataFile	
    - Initiate a transfer of a file to S3	
    - Singlepart file upload	
    - Multipart file upload	
    - Abort multipart file upload	
    - Add the Uploaded file to the Dataset	
    - Add multiple Uploaded Files to the Dataset	
    - Replace an existing file in the Dataset	
	

### GUI	
    - Menu for Settings		
    - Input API URL	
    - Input API Token	
    - Select destination dataset
    - File Chooser to select directory or multiple files

 	
### Possible later requirements (just ideas for now)  
    - Login via Username instead of API Token? (Not sure if possible yet)  
    - Support of non-direct upload (???)
