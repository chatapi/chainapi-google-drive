const {google} = require('googleapis');
const {GoogleAuth} = require('google-auth-library');
const {Readable} = require('stream');
const http = require('http');
const https = require('https');

//change this flag if you dont want to share your files
const shareFile = true;
//id of the folder, input your folder id over here
const sharedFolderKey = "CHANGE_THIS_FOLDER_KEY_VALUE";


/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.download = (req, res) => {
    const url = req.query.fileUrl ? req.query.fileUrl : req.body.fileUrl;
    let mimeType = '';
    let filename = url ? url.split('/') : '';
    filename = filename ? filename[filename.length - 1] : filename;

    const handleError = (err) => {
        res.status(500).send(JSON.stringify(err));
    }
    const testVars = () => {
        if (!url) {
            handleError({err: "No url was found"});
        }
        let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i');
        if (!url.match(new RegExp(pattern)) ) {
            handleError({err: "No valid url was found"});
        }
    }
    const getClient = () => {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive'
        });
        return auth.getClient();
    }
    const httpGet = (url) => {
        return new Promise((resolve, reject) => {
            let client = http;
            if (url.toString().indexOf("https") === 0) {
                client = https;
            }
            client.get(url, (resp) => {
                mimeType = resp.headers['content-type'];
                const readable = new Readable()
                readable._read = () => {
                }
                resp.on('data', (chunk) => {
                    readable.push(chunk);
                });
                // The whole response has been received. Pass readable streaml
                resp.on('end', () => {
                    readable.push(null);
                    resolve(readable)
                });

            }).on("error", (err) => {
                reject(err);
            });
        });
    }
    const issuePermissionsAndGetLink = (drive, driveData) => {
        return new Promise((resolve, reject) => {
            drive.permissions.create({
                resource: {
                    'type': 'anyone',
                    'role': 'reader',
                },
                fileId: driveData.data.id,
                fields: 'id',
            }, (permissionError, permissionResult) => {
                if (permissionError) {
                    reject(permissionError);
                } else {
                    const sharedLink = `https://drive.google.com/file/d/${driveData.data.id}/view?usp=sharing`;
                    // if file is over 100MB google built in antivirus will block direct download, to bypass it follow
                    // https://bytesbin.com/skip-google-drive-virus-scan-warning-large-files/ , but we dont recommend
                    // opening your api key for external users if there are such
                    const directDownloadLink = `https://drive.google.com/uc?export=download&id=${driveData.data.id}`;
                    resolve({sharedLink,directDownloadLink});
                }
            })
        });
    }
    const saveFile = (auth, readableStream) => {
        const drive = google.drive({version: 'v3', auth: auth});
        return new Promise((resolve, reject) => {
            drive.files.create({
                requestBody: {
                    name: filename,
                    mimeType: mimeType,
                    parents: sharedFolderKey ? [sharedFolderKey] : [],
                },
                media: {
                    mimeType: mimeType,
                    body: readableStream,
                },
            }).then(driveData => {
                if (!shareFile) {
                    res(driveData);
                } else {
                    issuePermissionsAndGetLink(drive, driveData).then(({sharedLink,directDownloadLink}) => {
                        driveData['sharedLink'] = sharedLink;
                        driveData['directDownloadLink'] = directDownloadLink;
                        resolve(driveData);
                    }, permissionsError => {
                        reject(permissionsError);
                    })
                }
            }, errDrive => {
                reject(errDrive);
            });
        })
    }


    testVars();
    httpGet(url).then(readableStream => {
        getClient().then(client => {
            saveFile(client, readableStream).then(data => {
                const result = {};
                result['data'] = data.data;
                if (data.sharedLink) {
                    result['sharedLink'] = data.sharedLink;
                }
                if (data.directDownloadLink) {
                    result['directDownloadLink'] = data.directDownloadLink;
                }
                res.status(200).send(JSON.stringify(result));
            }, err => {
                handleError(err);
            })
        }, err => {
            handleError(err);
        })
    }, err => {
        handleError(err);
    })
};
