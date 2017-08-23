'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
//import { Templates } from './template';
import { lspmodule } from './lspmodule';
import { contentprovidermodule } from './contentprovidermodule';

export function activate(context: vscode.ExtensionContext) {
  
  let disposableLSp = lspmodule.invoke_f8_lsp(context);

	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	/**************** START :: Stack analysis call *******************/

	const request = require('request');
	let stack_analysis_requests = new Map<String, String>();
	let stack_analysis_responses = new Map<String, String>();
  let STACK_API_TOKEN: string = '';

  const STACK_API_URL: string = "https://recommender.api.openshift.io/api/v1/stack-analyses-v2"

	let stack_collector = (file_uri, id, cb) => {
	
	const options = {};
    options['uri'] = `${STACK_API_URL}/${id}`;
    options['headers'] = {'Authorization': 'Bearer ' + STACK_API_TOKEN};
    request.get(options, (err, httpResponse, body) => {
      if (httpResponse.statusCode == 200 || httpResponse.statusCode == 202) {
        let data = JSON.parse(body);
        if (!data.hasOwnProperty("error")) {
			      vscode.window.showInformationMessage('Succsfully analysed your stack!!');
            stack_analysis_responses.set(file_uri, data);
            cb(data);
        }
        else {
            if (httpResponse.statusCode == 202) {
                vscode.window.showInformationMessage('Analysis in progress ...');
                setTimeout(() => { stack_collector(file_uri, id, cb); }, 10000);
            }
        }
      } else {
           vscode.window.showErrorMessage(`Failed to trigger stack analysis, Status:  ${httpResponse.statusCode} `);
           cb(null);
      }
    });
	};

	let get_stack_metadata = (file_uri, contextData, cb) => {
    // if (file_uri in stack_analysis_requests) {
    //     return;
    // }
    let manifest_array: any = ["requirements.txt","package.json","pom.xml"];
    let manifest_mime_type: any = {"requirements.txt" : "text/plain","package.json" : "application/json" ,"pom.xml" : "text/xml"};
    let thatContext: any;

    let file_uri_formatted: string = file_uri._formatted;
    let file_uri_split = file_uri_formatted.split("/");
    let file_uri_split_len: number = file_uri_split.length;
    if(file_uri_split_len > 0){
      let file_name:string = file_uri_split[file_uri_split_len - 1];
      if(manifest_array.indexOf(file_name) > -1){
         let form_data = {
          'manifest[]': [{
                value: contextData.manifest,
                options: {
                    filename: file_name,
                    contentType: manifest_mime_type[file_name]
                }
            }],
            'filePath[]': [file_uri_formatted],
            origin: contextData.origin || 'lsp'
          };
          const options = {};
          options['uri'] = `${STACK_API_URL}`;
          options['headers'] = {'Authorization': 'Bearer ' + STACK_API_TOKEN};
	        options['formData'] = form_data;
          thatContext = context;
    
          request.post(options, (err, httpResponse, body) => {
          if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
            let resp = JSON.parse(body);
            if (resp.error === undefined && resp.status == 'success') {
                stack_analysis_requests[file_uri] = resp.id;
                vscode.window.showInformationMessage(`Analyzing your stack, id ${resp.id}`);
				        //88a169f7c2364dc89cf10c26a274af3a resp.id
                setTimeout(() => { stack_collector(file_uri, resp.id , cb); }, 25000);
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
          vscode.window.showErrorMessage(`Failed to trigger stack analysis as file :  ${file_name} is not a valid manifest file`);
          provider.signalInit(file_uri,null);
        }
    }
	};

	/**************** END :: Stack analysis call *******************/


	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => {
		let editor = vscode.window.activeTextEditor;
    let text = editor.document.getText();

		// get_stack_metadata(editor.document.uri, {manifest: text, origin: 'lsp'}, (data) => { provider.signal(previewUri, data) });
    provider.signalInit(previewUri,null);

    let answer1: string;
    let options = {
      prompt: "Action: ",
      placeHolder: "Please provide your auth token"
    }

    let lastTagged = context.globalState.get('lastTagged', '');
    if(!lastTagged) {
      vscode.window.showInputBox(options).then(value => {
        if (!value) return;
        STACK_API_TOKEN = value;
        process.env['RECOMMENDER_API_TOKEN'] = STACK_API_TOKEN;
        context.globalState.update('lastTagged', STACK_API_TOKEN);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
          get_stack_metadata(editor.document.uri, {manifest: text, origin: 'lsp'}, (data) => { provider.signal(previewUri, data) });
          provider.signalInit(previewUri,null);
           }, (reason) => {
		 	    vscode.window.showErrorMessage(reason);
        });
      });
  } else {
       STACK_API_TOKEN = lastTagged;
       process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
       return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
        get_stack_metadata(editor.document.uri, {manifest: text, origin: 'lsp'}, (data) => { provider.signal(previewUri, data) });
        provider.signalInit(previewUri,null);
      }, (reason) => {
		 	  vscode.window.showErrorMessage(reason);
		  });
    }
	});

	let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
	context.subscriptions.push(disposable, registration, disposableLSp);
}

