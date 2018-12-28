'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { stackanalysismodule } from './stackanalysismodule';
import { Apiendpoint } from './apiendpoint';
import { ProjectDataProvider } from './ProjectDataProvider';
import { authextension } from './authextension';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';

export module multimanifestmodule {

    export let find_manifests_workspace: any;
    export let form_manifests_payload: any;
    export let triggerFullStackAnalyses: any;
    export let triggerManifestWs: any;
    export let manifestFileRead: any;
    export let dependencyAnalyticsReportFlow: any;

    find_manifests_workspace = (workspaceFolder, filesRegex) => {
        return new Promise(function(resolve, reject) {
            const relativePattern = new vscode.RelativePattern(workspaceFolder, `{${filesRegex},LICENSE}`);
            vscode.workspace.findFiles(relativePattern,'**/node_modules')
            .then((result: vscode.Uri[]) => {
                if(result && result.length){
                    resolve(result);
                } else {
                    vscode.window.showErrorMessage('No manifest file found to be analysed');
                    reject(null);
                }
            },
            // rejected
            (reason: any) => {
                vscode.window.showErrorMessage(reason);
                reject(null);
            });
        });
    };


    form_manifests_payload = (resultList) : any => {
        return new Promise((resolve,reject)=>{
            let fileReadPromises: Array<any> = [];
            for(let i=0;i<resultList.length;i++){
                let fileReadPromise = manifestFileRead(resultList[i]);
                fileReadPromises.push(fileReadPromise);
            }
    
            Promise.all(fileReadPromises)
            .then((datas) => {
                let form_data = {
                    'manifest[]': [],
                    'filePath[]': [],
                    'license[]': [],
                    origin: 'lsp'
                };
                datas.forEach((item) => {
                    if(item.manifest && item.filePath){
                        form_data['manifest[]'].push(item.manifest);
                        form_data['filePath[]'].push(item.filePath);
                    }
                    if(item.hasOwnProperty('license') &&  item.license.value){ 
                        form_data['license[]'].push(item.license);
                    }
                    //TODO : for logging 400 issue
                    if (!item.manifest && !item.license) {
                        console.log('Manifest is missed', item);
                    }
                    if (!item.filePath && !item.license) {
                        console.log('filePath is missed', item);
                    }
                });
                resolve(form_data);
            })
            .catch((error) => {
                reject(error);
            });
        });

    };


    manifestFileRead = (fileContent) => {
        let form_data = {
            'manifest': '',
            'filePath': '',
            'license': ''
        };
        let manifestObj: any;
        let manifest_mime_type: any = {'requirements.txt' : 'text/plain', 'package.json' : 'application/json' , 'pom.xml' : 'text/xml', 'pylist.json' : 'application/json', 'npmlist.json' : 'application/json'};
        let licenseObj: any;

        let filePath: string = '';
        let filePathList: any = [];
        let projRoot = vscode.workspace.getWorkspaceFolder(fileContent);
        let projRootPath = projRoot.uri.fsPath;
        return new Promise((resolve, reject) => {
            let fsPath : string = fileContent.fsPath ? fileContent.fsPath : '';
            fs.readFile(fsPath, function(err, data) {
                if(data){
                    manifestObj = {
                        value: '',
                        options: {
                            filename: '',
                            contentType: 'text/plain'
                        }
                    };
                    licenseObj = {
                        value: '',
                        options: {
                            filename: '',
                            contentType: 'text/plain'
                        }
                    };
                    if(!fileContent.fsPath.endsWith('LICENSE')){
                        let filePathSplit = /(\/target|\/stackinfo|\/poms|)/g;
                        let strSplit = '/';
                        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                            filePathSplit = /(\\target|\\stackinfo|\\poms|)/g;
                            strSplit = '\\';
                        }
                        filePath = fileContent.fsPath.split(projRootPath)[1].replace(filePathSplit, '');
                        filePathList = filePath.split(strSplit);

                        manifestObj.options.filename = filePathList[filePathList.length-1];
                        manifestObj.options.contentType = manifest_mime_type[filePathList[filePathList.length-1]];
                        manifestObj.value = data.toString();
                        form_data['manifest'] = manifestObj;
                        if(filePath && typeof filePath === 'string' && filePath.indexOf('npmlist') !== -1){
                            form_data['filePath'] = filePath.replace('npmlist','package');
                        }
                        else if(filePath && typeof filePath === 'string' && filePath.indexOf('pylist.json') !== -1){
                            form_data['filePath'] = filePath.replace('pylist.json','requirements.txt');
                        } else {
                            form_data['filePath'] = filePath;
                        }
                    } else {
                        licenseObj.options.filename = 'LICENSE';
                        licenseObj.options.contentType = 'text/plain';
                        licenseObj.value = data.toString();
                        form_data['license'] = licenseObj;
                    }
                    resolve(form_data);
                } else {
                    vscode.window.showErrorMessage(err.message);
                    reject(err.message);
                }

            });
        });
     };
    
    /*
    * Needed async function in order to wait for user selection in case of 
    * multi root projects
    */
    dependencyAnalyticsReportFlow = async (context, provider, previewUri) => {
        let editor = vscode.window.activeTextEditor;
        if(editor && editor.document.fileName && editor.document.fileName.toLowerCase().indexOf('pom.xml')!== -1) {
            let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            Apiendpoint.API_ECOSYSTEM = 'maven';
            if(workspaceFolder.uri.fsPath + '/pom.xml' === editor.document.fileName || workspaceFolder.uri.fsPath + '\\pom.xml' === editor.document.fileName) {
                triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
            } else {
                stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
            }
        } else if(editor && editor.document.fileName && editor.document.fileName.toLowerCase().indexOf('package.json')!== -1) {
            Apiendpoint.API_ECOSYSTEM = 'npm';
            stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
        } else if(editor && editor.document.fileName && editor.document.fileName.toLowerCase().indexOf('requirements.txt')!== -1) {
            Apiendpoint.API_ECOSYSTEM = 'pypi';
            stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
        } else if(vscode.workspace.hasOwnProperty('workspaceFolders') && vscode.workspace['workspaceFolders'].length>1){
            let workspaceFolder = await vscode.window.showWorkspaceFolderPick({placeHolder: 'Pick Workspace Folder...'}); 
                if (workspaceFolder) {
                    triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
                } else {
                    vscode.window.showInformationMessage(`No Workspace selected.`);
                }
        } else {
            let workspaceFolder = vscode.workspace.workspaceFolders[0];
            triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
        }
    };

    triggerFullStackAnalyses = (context, workspaceFolder, provider, previewUri) => {
        provider.signalInit(previewUri,null);
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
            return new Promise((resolve, reject) => {
                const relativePattern = new vscode.RelativePattern(workspaceFolder, '{pom.xml,**/package.json,requirements.txt}');
                vscode.workspace.findFiles(relativePattern,'**/node_modules').then(
                (result: vscode.Uri[]) => {
                    if(result && result.length){
                    // Do not create an effective pom if no pom.xml is present
                    let effective_pom_skip = true;
                    let effectiveF8WsVar = 'effectivef8Package';
                    Apiendpoint.API_ECOSYSTEM = 'npm';
                    let filesRegex = 'target/npmlist.json';
                    let pom_count = 0;
                    result.forEach((item) => {
                        if (item.fsPath.indexOf('pom.xml') >= 0) {
                            effective_pom_skip = false;
                            pom_count += 1;
                            Apiendpoint.API_ECOSYSTEM = 'maven';
                            effectiveF8WsVar = 'effectivef8PomWs';
                            filesRegex = 'target/stackinfo/**/pom.xml';
                        } else if(item.fsPath.indexOf('requirements.txt') >= 0){
                            Apiendpoint.API_ECOSYSTEM = 'pypi';
                            effectiveF8WsVar = 'effectivef8Pypi';
                            filesRegex = 'target/pylist.json';
                        }
                    });
    
                    if (!effective_pom_skip && pom_count === 0) {
                        vscode.window.showInformationMessage('Multi ecosystem support is not yet available.');
                        reject();
                        return;
                    } 
                    else {
                        p.report({message: StatusMessages.WIN_RESOLVING_DEPENDENCIES});
                        ProjectDataProvider[effectiveF8WsVar](workspaceFolder)
                            .then(async ()=> {
                                await triggerManifestWs(context, provider, previewUri);
                            })
                            .then(async ()=>{
                                let result = await find_manifests_workspace(workspaceFolder, filesRegex);
                                p.report({message: StatusMessages.WIN_ANALYZING_DEPENDENCIES});
                                return result;
                            })
                            .then(async (result)=>{
                                let formData = await form_manifests_payload(result);
                                return formData;
                            })
                            .then(async (formData)=>{
                                let payloadData = formData;
                                const options = {};
                                let thatContext: any;
                                options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                                options['formData'] = payloadData;
                                options['headers'] = {'origin': 'vscode','ecosystem': Apiendpoint.API_ECOSYSTEM};
                                thatContext = context;
                                let respId = await stackAnalysisServices.postStackAnalysisService(options, thatContext);
                                p.report({message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES});
                                return respId;
                            })
                            .then(async (respId)=>{
                                console.log(`Analyzing your stack, id ${respId}`);
                                const options = {};
                                options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/${respId}?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                                const interval = setInterval(() => {
                                    stackAnalysisServices.getStackAnalysisService(options).then((data) => {
                                        if (!data.hasOwnProperty('error')) {
                                            clearInterval(interval);
                                            provider.signal(previewUri, data);
                                            resolve();
                                        }
                                        // keep on waiting
                                    })
                                    .catch((error) => {
                                        clearInterval(interval);
                                        p.report({message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES});
                                        provider.signal(previewUri,null);
                                        console.log(error);
                                        vscode.window.showErrorMessage(error);
                                        reject();
                                    });;
                                }, 6000);
                            })
                            .catch((err) => {
                                p.report({message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES});
                                provider.signal(previewUri,null);
                                console.log(err);
                                vscode.window.showErrorMessage(err);
                                reject();
                            });
                        }
                    } else {
                    vscode.window.showInformationMessage(StatusMessages.NO_SUPPORTED_MANIFEST);
                    reject();
                    }
                },
                // Other ecosystem flow
                (reason: any) => {
                vscode.window.showInformationMessage(StatusMessages.NO_SUPPORTED_MANIFEST);
                });
            });
        });
    };

    triggerManifestWs = (context, provider, previewUri) => {
        return new Promise((resolve,reject) => {
            authextension.authorize_f8_analytics(context, (data) => {
            if(data){
                vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, StatusMessages.REPORT_TAB_TITLE).then((success) => {
                    provider.signalInit(previewUri,null);
                    resolve(true);
                }, (reason) => {
                    vscode.window.showErrorMessage(reason);
                    reject(reason);
                });
            } else {
                reject(`Unable to authenticate.`);
            }
            });
        });
      };
}