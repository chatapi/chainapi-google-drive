# chainapi-google-drive

1) Create new Google cloud project https://console.cloud.google.com/projectcreate or choose existing one. We will be referncing our project under "GoogleDriveProject" 
2) Go into  APIs & Services -> Library , search and enable "Cloud Build API" and "Google Drive API"
3) Go into IAM & Admin -> Service accounts, create new service account, we will reference it under "GoogleDriveUser", grant it Owner permissions in "Permissions" tab, under "Keys" tab add new JSON key
4) Go into your Google Drive account, create new folder, where your files will be saved. Share this folder by right clicking it and sharing it with our newly created Service account, just type in its email address.
5) Go in google functions https://console.cloud.google.com/functions/list ,
  - Create new function, its better to make the name of the function of 16-32 symbols, in order to make it more protected from being found ever. 
 - Choose whatever region suits you more
 - Leave Http trigger
 - Copy URL somewhere you need
 - In Authentication choose "Allow unauthenticated invocations", click on Save button
 - open runtime options, choose Memory allocated to 512 Mb if you will serve files over 256 Mb
 - In runtime service account choose our "GoogleDriveUser", without this step google drive API will not be available for you. Click on "Next" Button
 - leave latest Node.js under runtime, copy past contents of index.js and package.json to the function files
 - change "sharedFolderKey" constant with your folder id, it is text that follows /folders/ text, for example: in "https://drive.google.com/drive/folders/0BxL2BKcYFzUQTDJYV1djOEtnYzg?something=0-WVKid8cJNA2-Nw" folder key is 0BxL2BKcYFzUQTDJYV1djOEtnYzg
 - change entry point in the upper right corner to the "download"
 - deploy your function
6) After deployment copy and paste its address into widget

