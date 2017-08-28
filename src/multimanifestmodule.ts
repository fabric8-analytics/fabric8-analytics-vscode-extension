'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { stackanalysismodule } from './stackanalysismodule';

export module multimanifestmodule {

    const request = require('request');
    let stack_analysis_requests = new Map<String, String>();
	let stack_analysis_responses = new Map<String, String>();
    let STACK_API_TOKEN: string = '';
    const STACK_API_URL: string = "https://recommender.api.openshift.io/api/v1/stack-analyses-v2";

    export let find_manifests_workspace: any;
    export let form_manifests_payload: any;

    find_manifests_workspace = (context, provider, STACK_API_TOKEN, cb) => {

        let payloadData : any;
        vscode.workspace.findFiles('{**/pom.xml,**/requirements.txt,**/package.json}').then(
            // all good
            (result: vscode.Uri[]) => {
                //TODO for stack analysis payload
                if(result.length){
                    form_manifests_payload(result, (data) => {
                        if(data){
                            payloadData = data;
                            //payloadData = form_manifests_payload(result);
                            const options = {};
                            let thatContext: any;
                            let file_uri: string;
                            options['uri'] = `${STACK_API_URL}`;
                            options['headers'] = {'Authorization': 'Bearer ' + STACK_API_TOKEN};
                            options['formData'] = payloadData;
                            thatContext = context;

                            request.post(options, (err, httpResponse, body) => {
                            if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
                                let resp = JSON.parse(body);
                                if (resp.error === undefined && resp.status == 'success') {
                                    file_uri = payloadData['filePath[]'][0];
                                    stack_analysis_requests[file_uri] = resp.id;
                                    vscode.window.showInformationMessage(`Analyzing your stack, id ${resp.id}`);
                                    setTimeout(() => { stackanalysismodule.stack_collector(file_uri, resp.id, STACK_API_TOKEN, cb); }, 25000);
                                } else {
                                    vscode.window.showErrorMessage(`Failed :: ${resp.error }, Status: ${httpResponse.statusCode}`);
                                    cb(null);
                                }
                            } else if(httpResponse.statusCode == 401){
                                thatContext.globalState.update('lastTagged', '');
                                vscode.window.showErrorMessage(`Looks like your token is not proper, kindly re-run stack analysis`);
                                cb(null);
                            } else {   
                                vscode.window.showErrorMessage(`Failed to trigger stack analysis, Status: ${httpResponse}`);
                                cb(null);
                            }
                        });
                    } else {
                        vscode.window.showErrorMessage(`Failed to trigger stack analysis`);
                        cb(null);
                    }
                
                });
                } else {
                     vscode.window.showErrorMessage("No manifest file found to be analysed");
                     cb(null);
                }
                
                //vscode.commands.executeCommand('edit.findAndReplace');
            },
            // rejected
            (reason: any) => {
                vscode.window.showErrorMessage(reason);
                cb(null);
            });
    }


    form_manifests_payload = (resultList, callbacknew) : any => {
        let form_data = {
            'manifest[]': [],
            'filePath[]': [],
            origin: 'lsp'
        };
        let manifestObj: any;

        for(var i=0;i<resultList.length;i++){
             let filePath: string = '';
             let filePathList: any = [];
             (function(i) {
                vscode.workspace.openTextDocument(resultList[i]).then(
                    (result: any) => {
                         manifestObj = {
                                value: '',
                                options: {
                                    filename: '',
                                    contentType: 'text/plain'
                                }
                        };
                        //console.log(result.getText());
                        filePath = result.uri._fsPath;
                        filePathList = filePath.split('/');
                        manifestObj.value = result.getText();
                        manifestObj.options.filename = filePathList[filePathList.length-1];

                        form_data['manifest[]'].push(manifestObj);
                        form_data['filePath[]'].push(filePath);
                        if(i == resultList.length-1){
                            callbacknew(form_data);
                        }
                    },
                    (reason: any) => {
                        vscode.window.showErrorMessage(reason);
                        callbacknew(null);
                    }
                )
             })(i);
        }

    }



}