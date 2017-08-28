'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { lspmodule } from './lspmodule';
import { contentprovidermodule } from './contentprovidermodule';
import { stackanalysismodule } from './stackanalysismodule';
import { multimanifestmodule } from './multimanifestmodule';

export function activate(context: vscode.ExtensionContext) {
  
  let disposableLSp = lspmodule.invoke_f8_lsp(context);

	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

  let STACK_API_TOKEN: string = '';

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => {
		let editor = vscode.window.activeTextEditor;
    let text = editor.document.getText();

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
          stackanalysismodule.get_stack_metadata(context, editor.document.uri, {manifest: text, origin: 'lsp'}, provider, STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
          provider.signalInit(previewUri,null);
           }, (reason) => {
		 	    vscode.window.showErrorMessage(reason);
        });
      });
  } else {
       STACK_API_TOKEN = lastTagged;
       process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
       return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
        stackanalysismodule.get_stack_metadata(context, editor.document.uri, {manifest: text, origin: 'lsp'}, provider, STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
        provider.signalInit(previewUri,null);
      }, (reason) => {
		 	  vscode.window.showErrorMessage(reason);
		  });
    }
	});

  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => {
    //vscode.window.showInformationMessage("am in full stack analysis!!");
    //multimanifestmodule.find_manifests_workspace();
    let lastTagged = context.globalState.get('lastTagged', '');
    STACK_API_TOKEN = lastTagged;
    process.env['RECOMMENDER_API_TOKEN'] = lastTagged;
    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
          multimanifestmodule.find_manifests_workspace(context, provider, STACK_API_TOKEN, (data) => { provider.signal(previewUri, data) });
          provider.signalInit(previewUri,null);
           }, (reason) => {
		 	    vscode.window.showErrorMessage(reason);
        });
  });

	let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
	context.subscriptions.push(disposable, registration, disposableLSp, disposableFullStack);
}

