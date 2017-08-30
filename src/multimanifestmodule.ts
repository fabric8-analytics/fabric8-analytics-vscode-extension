'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { stackanalysismodule } from './stackanalysismodule';
import { Apiendpoint } from './apiendpoint';

export module multimanifestmodule {

    const request = require('request');
    let stack_analysis_requests = new Map<String, String>();
	let stack_analysis_responses = new Map<String, String>();

    export let find_manifests_workspace: any;
    export let form_manifests_payload: any;

    find_manifests_workspace = (context, provider, STACK_API_TOKEN, cb) => {

        let payloadData : any;
        vscode.workspace.findFiles('{**/pom.xml,**/requirements.txt,**/package.json}','**/node_modules').then(
            (result: vscode.Uri[]) => {
                if(result && result.length){
                    form_manifests_payload(result, (data) => {
                        if(data){
                            payloadData = data;
                            const options = {};
                            let thatContext: any;
                            let file_uri: string;
                            options['uri'] = `${Apiendpoint.STACK_API_URL}`;
                            options['headers'] = {'Authorization': 'Bearer ' + STACK_API_TOKEN};
                            options['formData'] = payloadData;
                            thatContext = context;
                            stackanalysismodule.post_stack_analysis(options,file_uri, STACK_API_TOKEN,thatContext, cb);

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
        let manifest_array: any = ["requirements.txt","package.json","pom.xml"];
        let manifest_mime_type: any = {"requirements.txt" : "text/plain","package.json" : "application/json" ,"pom.xml" : "text/xml"};

        for(var i=0;i<resultList.length;i++){
             let filePath: string = '';
             let filePathList: any = [];
             let projRootPath: string = vscode.workspace.rootPath;
             let projRootPathSplit: any = projRootPath.split('/');
             let projName: string = projRootPathSplit[projRootPathSplit.length-1];
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
                        if(result.uri._fsPath){
                            filePath = result.uri._fsPath.split(projName)[1];
                            filePathList = filePath.split('/');
                            manifestObj.options.filename = filePathList[filePathList.length-1];
                            manifestObj.options.contentType = manifest_mime_type[filePathList[filePathList.length-1]];
                        }
                        manifestObj.value = result.getText();

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