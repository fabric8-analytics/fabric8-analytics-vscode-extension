'use strict';

import * as vscode from 'vscode';
import { LanguageClient, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';
import * as fs from "fs";

import { stackanalysismodule } from './stackanalysismodule';
import { Apiendpoint } from './apiendpoint';

export module multimanifestmodule {

    const request = require('request');
    let stack_analysis_requests = new Map<String, String>();
	let stack_analysis_responses = new Map<String, String>();

    export let find_manifests_workspace: any;
    export let form_manifests_payload: any;
    export let find_epom_manifests_workspace: any;

    find_epom_manifests_workspace = (context, provider, OSIO_ACCESS_TOKEN, cb) => {

        let payloadData : any;
        vscode.workspace.findFiles('{target/stackinfo/**/pom.xml,LICENSE}','**/node_modules').then(
            (result: vscode.Uri[]) => {
                if(result && result.length){
                    form_manifests_payload(result, (data) => {
                        if(data){
                            payloadData = data;
                            const options = {};
                            let thatContext: any;
                            let file_uri: string;
                            options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                            options['headers'] = {'Authorization': 'Bearer ' + OSIO_ACCESS_TOKEN};
                            options['formData'] = payloadData;
                            thatContext = context;
                            stackanalysismodule.post_stack_analysis(options,file_uri, OSIO_ACCESS_TOKEN,thatContext, cb);

                    } else {
                        vscode.window.showErrorMessage(`Failed to trigger stack analysis`);
                        cb(null);
                    }
                
                });
                } else {
                     vscode.window.showErrorMessage("No manifest file found to be analyzed");
                     cb(null);
                }
                
            },
            // rejected
            (reason: any) => {
                vscode.window.showErrorMessage(reason);
                cb(null);
            });
    }

    find_manifests_workspace = (context, provider, OSIO_ACCESS_TOKEN, cb) => {

        let payloadData : any;
        vscode.workspace.findFiles('{**/pom.xml,**/requirements.txt,**/package.json,LICENSE}','**/node_modules').then(
            (result: vscode.Uri[]) => {
                if(result && result.length){
                    form_manifests_payload(result, (data) => {
                        if(data){
                            payloadData = data;
                            const options = {};
                            let thatContext: any;
                            let file_uri: string;
                            options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                            options['headers'] = {'Authorization': 'Bearer ' + OSIO_ACCESS_TOKEN};
                            options['formData'] = payloadData;
                            thatContext = context;
                            stackanalysismodule.post_stack_analysis(options,file_uri, OSIO_ACCESS_TOKEN,thatContext, cb);

                    } else {
                        vscode.window.showErrorMessage(`Failed to trigger stack analysis`);
                        cb(null);
                    }
                
                });
                } else {
                     vscode.window.showErrorMessage("No manifest file found to be analysed");
                     cb(null);
                }
                
            },
            // rejected
            (reason: any) => {
                vscode.window.showErrorMessage(reason);
                cb(null);
            });
    }


    form_manifests_payload = (resultList, callbacknew) : any => {
        let fileReadPromises: Array<any> = [];
        for(var i=0;i<resultList.length;i++){
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
            });
            callbacknew(form_data);
        })
        .catch(() => {
            callbacknew(null);
        });

    }


    let manifestFileRead = (fileContent) => {
        let form_data = {
            'manifest': '',
            'filePath': '',
            'license': ''
        };
        let manifestObj: any;
        let manifest_array: any = ["requirements.txt","package.json","pom.xml"];
        let manifest_mime_type: any = {"requirements.txt" : "text/plain","package.json" : "application/json" ,"pom.xml" : "text/xml"};
        let licenseObj: any;

        let filePath: string = '';
        let filePathList: any = [];
        let projRootPath: string = vscode.workspace.rootPath;
        let projRootPathSplit: any = projRootPath.split('/');
        let projName: string = projRootPathSplit[projRootPathSplit.length-1];
        return new Promise((resolve, reject) => {
            fs.readFile(fileContent._fsPath, function(err, data) {
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
                    if(!fileContent._fsPath.endsWith('LICENSE')){
                        filePath = fileContent._fsPath.split('/'+projName)[1].replace(/(\/target|\/stackinfo|\/poms|)/g, '');
                        filePathList = filePath.split('/');
                        manifestObj.options.filename = filePathList[filePathList.length-1];
                        manifestObj.options.contentType = manifest_mime_type[filePathList[filePathList.length-1]];
                        manifestObj.value = data.toString();
                        form_data['manifest'] = manifestObj;
                        form_data['filePath'] = filePath;
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
     }

}