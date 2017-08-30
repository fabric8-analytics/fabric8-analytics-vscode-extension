'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { lspmodule } from './lspmodule';
import { contentprovidermodule } from './contentprovidermodule';
import { stackanalysismodule } from './stackanalysismodule';
import { multimanifestmodule } from './multimanifestmodule';
import { Apiendpoint } from './apiendpoint';

export function activate(context: vscode.ExtensionContext) {
  
  let disposableLSp = lspmodule.invoke_f8_lsp(context);

	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => {
		let editor = vscode.window.activeTextEditor;
    let text = editor.document.getText();

    provider.signalInit(previewUri,null);

    let answer1: string;
    let options = {
      prompt: "Action: Enter openshift.io auth token",
      placeHolder: "Please provide your auth token, can be retrieved from OSIO"
    }

    let lastTagged = context.globalState.get('lastTagged', '');
    if(!lastTagged) {
      vscode.window.showInputBox(options).then(value => {
        if (!value) return;
        Apiendpoint.STACK_API_TOKEN = value;
        process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
        context.globalState.update('lastTagged', Apiendpoint.STACK_API_TOKEN);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
          stackanalysismodule.get_stack_metadata(context, editor.document.uri, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
          provider.signalInit(previewUri,null);
           }, (reason) => {
		 	    vscode.window.showErrorMessage(reason);
        });
      });
  } else {
       Apiendpoint.STACK_API_TOKEN = lastTagged;
       process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
       return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
        stackanalysismodule.get_stack_metadata(context, editor.document.uri, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
        provider.signalInit(previewUri,null);
      }, (reason) => {
		 	  vscode.window.showErrorMessage(reason);
		  });
    }
	});

  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => {
    provider.signalInit(previewUri,null);
    let lastTagged = context.globalState.get('lastTagged', '');
    Apiendpoint.STACK_API_TOKEN = lastTagged;
    process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
          multimanifestmodule.find_manifests_workspace(context, provider, Apiendpoint.STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
          provider.signalInit(previewUri,null);
           }, (reason) => {
		 	    vscode.window.showErrorMessage(reason);
        });
  });

	let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
	context.subscriptions.push(disposable, registration, disposableLSp, disposableFullStack);
}

