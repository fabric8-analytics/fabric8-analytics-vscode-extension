'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { Multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { Authextension } from './authextension';
import { StackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';

export class StackAnalysisModule {

    static stack_collector_count: number = 0;
    

    static stack_collector(file_uri, id, cb) {
        const options = {};
        this.stack_collector_count++;
        options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/${id}?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
        StackAnalysisServices.getStackAnalysisService(options)
        .then((respData) => {
            if (!respData.hasOwnProperty('error')) {
                cb(respData);
            }
            else {
                if(this.stack_collector_count <= 10){
                    setTimeout(() => { this.stack_collector(file_uri, id, cb); }, 6000);
                } else{
                    vscode.window.showErrorMessage(`Unable to get stack analyzed, try again`);
                    cb(null);
                }
            }
        })
        .catch((err) => {
            cb(null);
        });
	};

	static get_stack_metadata(context, editor, file_uri, cb) {
        let payloadData : any;
        let projRoot = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if(projRoot && file_uri){
            let projRootPath = projRoot.uri.fsPath;
            let encodedProjRootPath: any = projRootPath.replace(/ /g,'%20');
            let strSplit = '/';
            if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                strSplit = '\\';
            }
            let filePathList = file_uri.split(encodedProjRootPath+strSplit);
            if(filePathList && filePathList.length>1) {
            vscode.workspace.findFiles(`{${filePathList[1]},LICENSE}`,null).then(
                (result: vscode.Uri[]) => {
                    if(result && result.length){
                        Multimanifestmodule.form_manifests_payload(result, (data) => {
                            if(data){
                                payloadData = data;
                                const options = {};
                                let thatContext: any;
                                let file_uri: string;
                                options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                                options['formData'] = payloadData;
                                thatContext = context;

                                StackAnalysisServices.postStackAnalysisService(options, thatContext)
                                .then((respData) => {
                                    console.log(`Analyzing your stack, id ${respData}`);
                                    this.stack_collector_count = 0;
                                    this.stack_collector(file_uri, respData, cb);
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

    static processStackAnalyses(context, editor, provider, previewUri) {
        if(vscode && vscode.window && vscode.window.activeTextEditor) {
        let fileUri: string = editor.document.fileName;
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
            return new Promise((resolve, reject) => {
                p.report({message: StatusMessages.WIN_RESOLVING_DEPENDENCIES });
                let effectiveF8Var = 'effectivef8Package';
                if(fileUri.toLowerCase().indexOf('pom.xml')!== -1){
                    effectiveF8Var = 'effectivef8Pom';
                }

                ProjectDataProvider[effectiveF8Var](editor.document.uri.fsPath, (dataEpom) => {
                    if(dataEpom){
                        p.report({message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });
                        provider.signalInit(previewUri,null);
                        Authextension.authorize_f8_analytics(context, (data) => {
                            if(data){
                              return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, StatusMessages.REPORT_TAB_TITLE).then((success) => {
                                this.get_stack_metadata(context, editor, dataEpom, (data) => {
                                  if(data){
                                    p.report({message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES });
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
                      p.report({message: StatusMessages.WIN_FAILURE_RESOLVE_DEPENDENCIES});
                      reject();
                    }
                });
            });
          });
        } else {
            vscode.window.showInformationMessage(`No manifest file is active in editor`);
        }
    };


}
