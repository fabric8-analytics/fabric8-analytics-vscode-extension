'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { Templates } from './template';

export function activate(context: vscode.ExtensionContext) {

  /******************* START::  LSP client ***********************/

  // The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

  let lastTagged = context.globalState.get('lastTagged', '');
    if(lastTagged) {
       process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
    }
	
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}
	
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents 'plaintext','xml','json'
		documentSelector: [],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'languageServerExample',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	}
	
	// Create the language client and start the client.
	let disposableLSp = new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions).start();
	
  /******************* END ::  LSP client ***********************/

	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	const loader = Templates.LOADER_TEMPLATE;
  const header = Templates.HEADER_TEMPLATE;
  const footer = Templates.FOOTER_TEMPLATE;

let render_project_info = (sa) => {
  const result = sa.result[0];
  return `<div class='item-list'>
            <div class='item'><div class='item-key'>Analysis finished</div><div class='item-value'>${sa.finished_at}</div></div>
            <div class='item'><div class='item-key'>Distinct Licenses</div><div class='item-value'>${result.user_stack_info.distinct_licenses}</div></div>
            <div class='item'><div class='item-key'>Ecosystem</div><div class='item-value'>${result.user_stack_info.ecosystem}</div></div>
          </div>
          <div>
	          <p>To view detail report <a href="index.html" target="_self">Click here</a> use ID as ${sa.request_id}</p>
          </div>`;
};

let render_project_failure = () => {
  //const result = sa.result[0];
  return `<div>
	          <p>Analysis failed!!</p>
          </div>`;
};

let render_stack_iframe = (sa) => {
  const result = sa.result[0];
  return ` <iframe width="100%" height="100%" frameborder="0" src="http://ops-portal-v2-ops-portal-ide.dev.rdu2c.fabric8.io/#/analyze/${sa.request_id}?interframe=true" id="frame2" name="frame2"></iframe>`
}

	class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
		private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
		private _loading = true;
		private _output = null;

		public provideTextDocumentContent(uri: vscode.Uri): string {
			if (this._loading) {
      			return loader;
    		} else {
            if(this._output){
              let r = header;
      			  //r += render_project_info(this._output);
              r += render_stack_iframe(this._output)
      			  r += footer;
      			  return r;
            } else {
              let r = header;
      			  r += render_project_failure();
      			  r += footer;
      			  return r;
            }
      			
    		}
		}

		get onDidChange(): vscode.Event<vscode.Uri> {
			return this._onDidChange.event;
		}

		public update(uri: vscode.Uri) {
			this._onDidChange.fire(uri);
		}

		public signal(uri: vscode.Uri, data: string) {
    		this._loading = false;
    		this._output = data;
    		this.update(uri);
  		}

      public signalInit(uri: vscode.Uri, data: string) {
    		this._loading = true;
    		this._output = data;
    		this.update(uri);
  		}
	}

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
           vscode.window.showErrorMessage(`Failed to trigger stack analysis , Status:  ${httpResponse.statusCode} `);
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
            vscode.window.showErrorMessage(`Failed to trigger stack analysis, Status: ${httpResponse.statusCode}`);
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


	let provider = new TextDocumentContentProvider();
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
