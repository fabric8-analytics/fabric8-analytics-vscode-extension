'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';

export module stackanalysismodule {
    export let get_stack_metadata: any;
    export let post_stack_analysis: any;
    export let processStackAnalyses: any;

	get_stack_metadata = (editor, file_uri) => {
        return new Promise(function(resolve,reject) {
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
                            resolve(result);
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
            provider.signalInit(previewUri,null);
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
                    ProjectDataProvider[effectiveF8Var](argumentList)
                    .then(async (dataEpom)=> {
                        await multimanifestmodule.triggerManifestWs(context, provider, previewUri);
                        return dataEpom;
                    })
                    .then(async (dataEpom)=>{
                        let result = await get_stack_metadata(editor, dataEpom);
                        p.report({message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });
                        return result;
                    })
                    .then(async (result)=>{
                        let formData = await multimanifestmodule.form_manifests_payload(result);
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
                                    p.report({message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES});
                                    provider.signal(previewUri, data);
                                    resolve();
                                }
                                // keep on waiting
                            })
                            .catch(() => {
                                clearInterval(interval);
                                provider.signal(previewUri,null);
                                reject();
                            });;
                        }, 6000);
                    })
                    .catch(() => {
                        p.report({message: StatusMessages.WIN_FAILURE_RESOLVE_DEPENDENCIES});
                        provider.signal(previewUri,null);
                        reject();
                    });
                });
            });
        } else {
            vscode.window.showInformationMessage(`No manifest file is active in editor`);
        }
    };
}
