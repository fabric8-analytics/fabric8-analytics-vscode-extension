'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Apiendpoint } from './apiendpoint';

export module stackanalysismodule {

    const request = require('request');
    let stack_analysis_requests = new Map<String, String>();
	let stack_analysis_responses = new Map<String, String>();

    export let stack_collector: any;
    export let get_stack_metadata: any;
    export let post_stack_analysis: any;

    stack_collector = (file_uri, id, OSIO_ACCESS_TOKEN, cb) => {
        const options = {};
        options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/${id}?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
        options['headers'] = {'Authorization': 'Bearer ' + OSIO_ACCESS_TOKEN};
        request.get(options, (err, httpResponse, body) => {
        if (httpResponse.statusCode == 200 || httpResponse.statusCode == 202) {
            let data = JSON.parse(body);
            if (!data.hasOwnProperty("error")) {
                console.log("ts for get stack analysis"+ new Date());
                //vscode.window.showInformationMessage('Succsfully analysed your stack!!');
                stack_analysis_responses.set(file_uri, data);
                cb(data);
            }
            else {
                if (httpResponse.statusCode == 202) {
                    //vscode.window.showInformationMessage('Analysis in progress ...');
                    setTimeout(() => { stack_collector(file_uri, id, OSIO_ACCESS_TOKEN, cb); }, 1000);
                }
            }
        } else {
            vscode.window.showErrorMessage(`Failed to trigger stack analysis, Status:  ${httpResponse.statusCode} `);
            cb(null);
        }
        });
	};

	get_stack_metadata = (context, file_uri, contextData, provider, OSIO_ACCESS_TOKEN, cb) => {
    // if (file_uri in stack_analysis_requests) {
    //     return;
    // }
    let manifest_array: any = ["requirements.txt","package.json","pom.xml"];
    let manifest_mime_type: any = {"requirements.txt" : "text/plain","package.json" : "application/json" ,"pom.xml" : "text/xml"};
    let thatContext: any;

    //let file_uri_formatted: string = file_uri._formatted;
    let file_uri_formatted: string = file_uri.replace(/ /g,"%20");

    let file_uri_split = file_uri_formatted.split("/");
    let file_uri_split_len: number = file_uri_split.length;
    let projRootPath: string = vscode.workspace.rootPath;
    if(file_uri_split_len > 0){
        //let projRootPath: string = vscode.workspace.rootPath;
        let file_name:string = file_uri_split[file_uri_split_len - 1];
        let file_path: string;
        if(projRootPath){
            let encodedProjRootPath: any = projRootPath.replace(/ /g,"%20");
            let projRootPathSplit: any = encodedProjRootPath.split('/');
            let projName: string = projRootPathSplit[projRootPathSplit.length-1];  
            file_path = file_uri_formatted.split(projName)[1].replace(/(target[/]|stackinfo[/]|poms[/]|)/g, '');
        } else{
            file_path = file_name;
        }
        if(manifest_array.indexOf(file_name) > -1){
         let form_data = {
          'manifest[]': [{
                value: contextData.manifest,
                options: {
                    filename: file_name,
                    contentType: manifest_mime_type[file_name]
                }
            }],
            'filePath[]': [file_path],
            origin: contextData.origin || 'lsp'
          };
          const options = {};
          options['uri'] = `${Apiendpoint.STACK_API_URL}analyse?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
          options['headers'] = {'Authorization': 'Bearer ' + OSIO_ACCESS_TOKEN};
	      options['formData'] = form_data;
          thatContext = context;

          post_stack_analysis(options,file_uri, OSIO_ACCESS_TOKEN,thatContext, cb);

        } else {
          vscode.window.showErrorMessage(`Failed to trigger stack analysis as file :  ${file_name} is not a valid manifest file`);
          provider.signalInit(file_uri,null);
        }
    }
	};


    post_stack_analysis = (options,file_uri, OSIO_ACCESS_TOKEN,thatContext, cb) => {
        debugger

        request.post(options, (err, httpResponse, body) => {
          if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
            let resp = JSON.parse(body);
            if (resp.error === undefined && resp.status == 'success') {
                stack_analysis_requests[file_uri] = resp.id;
                console.log("ts for successful Post analysis"+ new Date());
                //vscode.window.showInformationMessage(`Analyzing your stack, id ${resp.id}`);
                setTimeout(() => { stack_collector(file_uri, resp.id, OSIO_ACCESS_TOKEN, cb); }, 1000);
            } else {
                vscode.window.showErrorMessage(`Failed :: ${resp.error }, Status: ${httpResponse.statusCode}`);
                cb(null);
            }
          } else if(httpResponse.statusCode == 401){
              thatContext.globalState.update('f8_access_token', '');
              thatContext.globalState.update('f8_refresh_token', '');
              vscode.window.showErrorMessage(`Looks like your token is not proper, kindly re authorize with Openshift.io`);
              cb(null);
          } else {   
            vscode.window.showErrorMessage(`Failed to trigger stack analysis, Status: ${httpResponse.statusCode}`);
            cb(null);
          }
        });
    }

}