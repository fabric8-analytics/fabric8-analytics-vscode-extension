'use strict';

import * as vscode from 'vscode';

import { Commands } from './commands';
import { lspmodule } from './lspmodule';
import { contentprovidermodule } from './contentprovidermodule';
import { stackanalysismodule } from './stackanalysismodule';
import { multimanifestmodule } from './multimanifestmodule';
import { Apiendpoint } from './apiendpoint';
import { authextension } from './authextension';

import { ProjectDataProvider } from './ProjectDataProvider';

export function activate(context: vscode.ExtensionContext) {
	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
  let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => stackanalysismodule.triggerStackAnalyses(context, provider, previewUri));

  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => {
    if(vscode.workspace.hasOwnProperty('workspaceFolders') && vscode.workspace['workspaceFolders'].length>1){
      vscode.window.showInformationMessage(`Multi-root Workspaces are not supported currently, Coudn't find valid manifest file at root workspace level`);
    } else {
      provider.signalInit(previewUri,null);
      vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Generate application stack report'}, p => {
        return new Promise((resolve, reject) => { 

          vscode.workspace.findFiles('{pom.xml,**/package.json}','**/node_modules').then(
            (result: vscode.Uri[]) => {
                if(result && result.length){
                  // Do not create an effective pom if no pom.xml is present
                  let effective_pom_skip = true;
                  let pom_count = 0;
                  result.forEach((item) => {
                    if (item.fsPath.indexOf('pom.xml') >= 0) {
                      effective_pom_skip = false;
                      pom_count += 1;
                    }
                  });

                  if (!effective_pom_skip && pom_count === 0) {
                    vscode.window.showInformationMessage('Multi ecosystem support is not yet available.');
                    reject();
                    return;
                  }
                  if(effective_pom_skip) {
                    ProjectDataProvider.effectivef8Package(vscode.workspace.rootPath+'/', (ePkgPath) => {
                      if(ePkgPath){
                        p.report({message: 'Analyzing your stack ...' });
                        // effective package generated
                        let filesRegex = 'target/package.json';
                        if(triggerManifestWs(authextension, filesRegex)){
                          p.report({message: 'Successfully generated stack report ...' });
                          resolve();
                        } else {
                          reject();
                        } 
                      } else {
                        // effective package not generated
                        p.report({message: 'Unable to resolve dependencies in package.json ...' });
                        reject();
                      }
                    });
                  } else {
                    ProjectDataProvider.effectivef8PomWs(vscode.workspace.rootPath, effective_pom_skip, (dataEpom) => {
                      if(dataEpom){
                        p.report({message: 'Analyzing your stack ...' });
                        // effective pom generated
                        let filesRegex = 'target/stackinfo/**/pom.xml';
                        if(triggerManifestWs(authextension, filesRegex)){
                          p.report({message: 'Successfully generated stack report ...' });
                          resolve();
                        } else {
                          reject();
                        } 
                      } else {
                        // effective pom not generated
                        p.report({message: 'Unable to generate effective pom ...' });
                        reject();
                      }
                    });
                  }
                } else {
                  vscode.window.showInformationMessage(`Coudn't find manifest at root workspace level`);
                  reject();
                }
            },
            // Other ecosystem flow
            (reason: any) => {
                authextension.authorize_f8_analytics(context, (data) => {
                  if(data){
                    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'Application stack report').then((success) => {
                      multimanifestmodule.find_manifests_workspace(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, (data) => { 
                        if(data){
                          provider.signal(previewUri, data);
                          p.report({message: 'Successfully generated stack report ...' });
                          resolve();
                        } else {
                          provider.signal(previewUri,null);
                          reject();
                        }
                      });
                      provider.signalInit(previewUri,null);
                      }, (reason) => {
                      vscode.window.showErrorMessage(reason);
                      reject();
                    });
                  } else {
                      reject();
                  }
                });
      
            });


        });
      });
    }
  });

  function triggerManifestWs(authextension, filesRegex) {
    authextension.authorize_f8_analytics(context, (data) => {
      if(data){
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'Application stack report').then((success) => {
          let manifest_finder = multimanifestmodule.find_manifests_workspace;
          manifest_finder(context, provider, Apiendpoint.OSIO_ACCESS_TOKEN, filesRegex, (data) => { 
            if(data){
              provider.signal(previewUri, data);
              return true;
            }else {
              provider.signal(previewUri,null);
              return false;
            }
          });
          provider.signalInit(previewUri,null);
          }, (reason) => {
          vscode.window.showErrorMessage(reason);
          return false;
        });
      } else {
          return false;
      }
    });
  };

  lspmodule.invoke_f8_lsp(context, (disposableLSp) => {
    // let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,0,.35)' });
    stackanalysismodule.clearContextInfo(context);
	  context.subscriptions.push(disposable, registration, disposableLSp, disposableFullStack);
  });

}

