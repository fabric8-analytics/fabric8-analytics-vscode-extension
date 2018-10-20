'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { authextension } from './authextension';
import { stackAnalysisServices } from './stackAnalysisService';

export module stackanalysismodule {

    export let stack_collector_count = 0;

    export let stack_collector: any;
    export let get_stack_metadata: any;
    export let post_stack_analysis: any;
    export let triggerStackAnalyses: any;
    export let processStackAnalyses: any;

    stack_collector = (file_uri, id, cb) => {
        const options = {};
        stack_collector_count++;
        options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/${id}?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
        stackAnalysisServices.getStackAnalysisService(options)
        .then((respData) => {
            if (!respData.hasOwnProperty('error')) {
                cb(respData);
            }
            else {
                if(stack_collector_count <= 10){
                    setTimeout(() => { stack_collector(file_uri, id, cb); }, 6000);
                } else{
                    vscode.window.showErrorMessage(`Unable to get stack analyzed, try again`);
                    cb(null);
                }
            }
        })
        .catch((err) => {
            console.log(err);
            cb(null);
        });
	};

	get_stack_metadata = (context, file_uri, cb) => {

        let payloadData : any;
        let projRootPath: string = vscode.workspace.rootPath;
        if(projRootPath && file_uri){
            let encodedProjRootPath: any = projRootPath.replace(/ /g,'%20');
            let strSplit = '/';
            if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                strSplit = '\\';
            }
            let projRootPathSplit: any = encodedProjRootPath.split(strSplit);
            let projName: string = projRootPathSplit[projRootPathSplit.length-1];
            let filePathList = file_uri.split(projName+strSplit);
            
            if(filePathList && filePathList.length>1) {
            vscode.workspace.findFiles(`{${filePathList[1]},LICENSE}`,null).then(
                (result: vscode.Uri[]) => {
                    if(result && result.length){
                        multimanifestmodule.form_manifests_payload(result, (data) => {
                            if(data){
                                payloadData = data;
                                const options = {};
                                let thatContext: any;
                                let file_uri: string;
                                options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                                options['formData'] = payloadData;
                                thatContext = context;

                                stackAnalysisServices.postStackAnalysisService(options, thatContext)
                                .then((respData) => {
                                    console.log(`Analyzing your stack, id ${respData}`);
                                    stack_collector_count = 0;
                                    stack_collector(file_uri, respData, cb);
                                })
                                .catch((err) => {
                                    console.log(err);
                                    cb(null);
                                });

                            } else {
                                vscode.window.showErrorMessage(`Failed to trigger application's stack analysis`);
                                cb(null);
                            }

                        });
                    } else {
                        vscode.window.showErrorMessage('No manifest file found to be analyzed');
                        cb(null);
                    }
                },
                // rejected
                (reason: any) => {
                    vscode.window.showErrorMessage(reason);
                    cb(null);
                });
            } else {
                vscode.window.showErrorMessage('Please reopen the file, unable to get filepath');
                cb(null);
            }

        } else {
            vscode.window.showErrorMessage('Please reopen the Project, unable to get project path');
            cb(null);
        }
	};

    processStackAnalyses = (context, provider, previewUri) => {
        if(vscode && vscode.window && vscode.window.activeTextEditor) {
        let editor = vscode.window.activeTextEditor;
        let fileUri: string = editor.document.fileName;
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Generate application stack report'}, p => {
            return new Promise((resolve, reject) => {
                let effectiveF8Var = 'effectivef8Package';
                if(fileUri.toLowerCase().indexOf('pom.xml')!== -1){
                    effectiveF8Var = 'effectivef8Pom';
                }

                ProjectDataProvider[effectiveF8Var](editor.document.uri.fsPath, (dataEpom) => {
                    if(dataEpom){
                        p.report({message: 'Analyzing your stack ...' });
                        provider.signalInit(previewUri,null);
                        authextension.authorize_f8_analytics(context, (data) => {
                            if(data){
                              return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'Application stack report').then((success) => {
                                stackanalysismodule.get_stack_metadata(context, dataEpom, (data) => {
                                  if(data){
                                    p.report({message: 'Successfully generated stack report ...' });
                                    resolve();
                                    provider.signal(previewUri, data);
                                  } else {
                                    provider.signal(previewUri,null);
                                    reject();
                                  }
                                });
                                provider.signalInit(previewUri,null);
                              }, (reason) => {
                                    reject();
                                    vscode.window.showErrorMessage(reason);
                              });
                            } else {
                                reject();
                            }
                        });
                    } else {
                      p.report({message: 'Unable to resolve dependencies ...' });
                      reject();
                    }
                });
            });
          });
        } else {
            vscode.window.showInformationMessage(`No manifest file is active in editor`);
        }
    };

    triggerStackAnalyses = (context, provider, previewUri) => {
        if(vscode.workspace.hasOwnProperty('workspaceFolders') && vscode.workspace.hasOwnProperty['workspaceFolders'] &&
        vscode.workspace['workspaceFolders'] && vscode.workspace['workspaceFolders'].length>1){
            vscode.window.showInformationMessage('Multi-root Workspaces are not supported currently');
        } else if(vscode.window.activeTextEditor){
            processStackAnalyses(context, provider, previewUri);
        } else {
            vscode.window.showInformationMessage('No manifest file is active in editor');
        }
    };

}
