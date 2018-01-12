'use strict';

import * as vscode from 'vscode';
import { workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { lspmodule } from './lspmodule';
import { contentprovidermodule } from './contentprovidermodule';
import { stackanalysismodule } from './stackanalysismodule';
import { multimanifestmodule } from './multimanifestmodule';
import { Apiendpoint } from './apiendpoint';
import { authextension } from './authextension';

import { ProjectDataProvider } from "./ProjectDataProvider";

export function activate(context: vscode.ExtensionContext) {
  
	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => {
		let editor = vscode.window.activeTextEditor;
    let text = editor.document.getText();
    let fileUri: string = editor.document.fileName;
    if(fileUri.toLowerCase().indexOf("pom.xml")!= -1){
      ProjectDataProvider.effectivef8Pom(editor.document.uri, (dataEpom) => {
        if(dataEpom){
          provider.signalInit(previewUri,null);
          authextension.authorize_f8_analytics(context, (data) => {
            if(data){
              return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                  stackanalysismodule.get_stack_metadata(context, dataEpom, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { provider.signal(previewUri, data) });
                  provider.signalInit(previewUri,null);
                }, (reason) => {
                  vscode.window.showErrorMessage(reason);
                });
            } else {
              vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
            }
          });
        } else {
            vscode.window.showInformationMessage("Looks like there either are some problem with manifest file or mvn is not set in path");
        }
      });
    } else {
      provider.signalInit(previewUri,null);
          authextension.authorize_f8_analytics(context, (data) => {
            if(data){
              return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                  stackanalysismodule.get_stack_metadata(context, editor.document.fileName, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { provider.signal(previewUri, data) });
                  provider.signalInit(previewUri,null);
                }, (reason) => {
                  vscode.window.showErrorMessage(reason);
                });
            } else {
              vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
            }
          });
    }
	});

  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => {
    provider.signalInit(previewUri,null);
    vscode.workspace.findFiles('{pom.xml}','**/node_modules').then(
      (result: vscode.Uri[]) => {
          if(result && result.length){
            ProjectDataProvider.effectivef8PomWs(vscode.workspace.rootPath, (dataEpom) => {
              if(dataEpom){
                // effective pom generated
                authextension.authorize_f8_analytics(context, (data) => {
                  if(data){
                    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                      multimanifestmodule.find_epom_manifests_workspace(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { provider.signal(previewUri, data) });
                      provider.signalInit(previewUri,null);
                       }, (reason) => {
                       vscode.window.showErrorMessage(reason);
                    });
                  } else {
                    vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
                  }
                });
                
              }else{
                // effective pom not generated
                vscode.window.showInformationMessage("Looks like there either are some problem with manifest file or mvn is not set in path");
              }
            });

          } 
      },
      // Other ecosystem flow
      (reason: any) => {
          authextension.authorize_f8_analytics(context, (data) => {
            if(data){
              return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                multimanifestmodule.find_manifests_workspace(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { provider.signal(previewUri, data) });
                provider.signalInit(previewUri,null);
                 }, (reason) => {
                 vscode.window.showErrorMessage(reason);
              });
            } else {
              vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
            }
          });

      });

  });

  lspmodule.invoke_f8_lsp(context, (disposableLSp) => {
    let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
	  context.subscriptions.push(disposable, registration, disposableLSp, disposableFullStack);
  })

}

