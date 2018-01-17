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

    vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Analyzing your stack ...'}, p => {
      return new Promise((resolve, reject) => {       
        if(fileUri.toLowerCase().indexOf("pom.xml")!= -1){
          p.report({message: 'Generating effective pom ...' });
          ProjectDataProvider.effectivef8Pom(editor.document.uri, (dataEpom) => {
              if(dataEpom){
                p.report({message: 'Analysing your stack ...' });
                  provider.signalInit(previewUri,null);
                    authextension.authorize_f8_analytics(context, (data) => {
                      if(data){
                        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                          stackanalysismodule.get_stack_metadata(context, dataEpom, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { 
                            p.report({message: 'Successfully generated stack report ...' });
                            resolve();
                            provider.signal(previewUri, data) 
                          });
                          provider.signalInit(previewUri,null);
                        }, (reason) => {
                              reject();
                              vscode.window.showErrorMessage(reason);
                        });
                      } else {
                        vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
                        reject();
                      }
                  });
            } else {
                p.report({message: 'Unable to generate effective pom ...' });
                reject();
                vscode.window.showInformationMessage("Looks like there either are some problem with manifest file or mvn is not set in path");
              }
          });
        } else {
            p.report({message: 'Analyzing your stack ...' });
            provider.signalInit(previewUri,null);
            authextension.authorize_f8_analytics(context, (data) => {
              if(data){
                return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                  stackanalysismodule.get_stack_metadata(context, editor.document.fileName, {manifest: text, origin: 'lsp'}, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => {
                    p.report({message: 'Successfully generated stack report ...' });
                    resolve();
                    provider.signal(previewUri, data) 
                  });
                  provider.signalInit(previewUri,null);
                }, (reason) => {
                  reject();
                  vscode.window.showErrorMessage(reason);
                });
              } else {
                  vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
                  reject();
                }
            });
        }

      });
    });    
	});

  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => {
    provider.signalInit(previewUri,null);
    vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Analyzing your stack ...'}, p => {
      return new Promise((resolve, reject) => { 

        vscode.workspace.findFiles('{pom.xml}','**/node_modules').then(
          (result: vscode.Uri[]) => {
              if(result && result.length){
                p.report({message: 'Generating effective pom ...' });
                ProjectDataProvider.effectivef8PomWs(vscode.workspace.rootPath, (dataEpom) => {
                  if(dataEpom){
                    p.report({message: 'Analyzing your stack ...' });
                    // effective pom generated
                    authextension.authorize_f8_analytics(context, (data) => {
                      if(data){
                        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'fabric8-analytics stack report').then((success) => {
                          multimanifestmodule.find_epom_manifests_workspace(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { 
                            provider.signal(previewUri, data);
                            p.report({message: 'Successfully generated stack report ...' });
                            resolve();
                          });
                          provider.signalInit(previewUri,null);
                           }, (reason) => {
                           vscode.window.showErrorMessage(reason);
                           reject();
                        });
                      } else {
                        vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
                        reject();
                      }
                    });
                    
                  } else {
                    // effective pom not generated
                    p.report({message: 'Unable to generate effective pom ...' });
                    reject();
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
                    multimanifestmodule.find_manifests_workspace(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { 
                      provider.signal(previewUri, data);
                      p.report({message: 'Successfully generated stack report ...' });
                      resolve();
                    });
                    provider.signalInit(previewUri,null);
                     }, (reason) => {
                     vscode.window.showErrorMessage(reason);
                     reject();
                  });
                } else {
                  vscode.window.showInformationMessage("Looks like your extension is not authorized, kindly authorize with OSIO");
                  reject();
                }
              });
    
          });


      });
    });
  });

  lspmodule.invoke_f8_lsp(context, (disposableLSp) => {
    let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
	  context.subscriptions.push(disposable, registration, disposableLSp, disposableFullStack);
  })

}

