'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { authextension } from './authextension';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';

export module stackanalysismodule {

    export let stack_collector_count = 0;

    export let stack_collector: any;
    export let get_stack_metadata: any;
    export let post_stack_analysis: any;
    export let processStackAnalyses: any;

    stack_collector = (id) => {
        return new Promise(function(resolve, reject){
            const options = {};
            stack_collector_count++;
            options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/${id}?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
            stackAnalysisServices.getStackAnalysisService(options)
            .then((respData) => {
                resolve(respData);
            })
            .catch(() => {
                reject(null);
            });
        });
	};

	get_stack_metadata = (context, editor, file_uri) => {
        return new Promise(function(resolve,reject) {
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
                    const relativePattern = new vscode.RelativePattern(projRoot, `{${filePathList[1]},LICENSE}`);
                    vscode.workspace.findFiles(relativePattern,null).then(
                    (result: vscode.Uri[]) => {
                        if(result && result.length){
                            multimanifestmodule.form_manifests_payload(result).then((data)=>{
                                payloadData = data;
                                const options = {};
                                let thatContext: any;
                                options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                                options['formData'] = payloadData;
                                options['headers'] = {'origin': 'vscode','ecosystem': Apiendpoint.API_ECOSYSTEM};
                                thatContext = context;

                                stackAnalysisServices.postStackAnalysisService(options, thatContext)
                                .then((respId) => {
                                    console.log(`Analyzing your stack, id ${respId}`);
                                    const interval = setInterval(() => {
                                        stackanalysismodule.stack_collector(respId).then((data) => {
                                            if (!data.hasOwnProperty('error')) {
                                                clearInterval(interval);
                                                resolve(data);
                                            }
                                            // keep on waiting
                                        })
                                        .catch(() => {
                                            clearInterval(interval);
                                            reject(null);
                                        });;
                                    }, 6000);
                                })
                                .catch((err) => {
                                    console.log(err);
                                    reject(null);
                                });
                            })
                            .catch(()=>{
                                vscode.window.showErrorMessage(`Failed to trigger application's stack analysis`);
                                reject(null);
                            });
                        } else {
                            vscode.window.showErrorMessage('No manifest file found to be analyzed');
                            reject(null);
                        }
                    },
                    // rejected
                    (reason: any) => {
                        vscode.window.showErrorMessage(reason);
                        reject(null);
                    });
                } else {
                    vscode.window.showErrorMessage('Please reopen the file, unable to get filepath');
                    reject(null);
                }
    
            } else {
                vscode.window.showErrorMessage('Please reopen the Project, unable to get project path');
                reject(null);
            }
        });
	};

    processStackAnalyses = (context, editor, provider, previewUri) => {
        if(vscode && vscode.window && vscode.window.activeTextEditor) {
        let fileUri: string = editor.document.fileName;
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
            return new Promise((resolve, reject) => {
                p.report({message: StatusMessages.WIN_RESOLVING_DEPENDENCIES });
                let effectiveF8Var = 'effectivef8Package';
                let argumentList = workspaceFolder;
                if(fileUri.toLowerCase().indexOf('pom.xml')!== -1){
                    effectiveF8Var = 'effectivef8Pom';
                    argumentList = editor.document.uri.fsPath;
                } else if(fileUri.toLowerCase().indexOf('requirements.txt')!== -1){
                    effectiveF8Var = 'effectivef8Pypi';
                }
                ProjectDataProvider[effectiveF8Var](argumentList).then((dataEpom)=> {
                    p.report({message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });
                    provider.signalInit(previewUri,null);
                    authextension.authorize_f8_analytics(context, (data) => {
                        if(data){
                            return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, StatusMessages.REPORT_TAB_TITLE).then((success) => {
                            
                                get_stack_metadata(context, editor, dataEpom).then((data)=>{
                                    p.report({message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES });
                                    resolve();
                                    provider.signal(previewUri, data);
                                }).catch(()=> {
                                    provider.signal(previewUri,null);
                                    reject();
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
                }).catch(() => {
                    p.report({message: StatusMessages.WIN_FAILURE_RESOLVE_DEPENDENCIES});
                    reject();
                });
            });
          });
        } else {
            vscode.window.showInformationMessage(`No manifest file is active in editor`);
        }
    };
}
