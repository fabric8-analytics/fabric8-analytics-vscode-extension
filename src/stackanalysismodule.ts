'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';
import { DependencyReportPanel } from './dependencyReportPanel';

export module stackanalysismodule {
  export const get_stack_metadata = (editor, file_uri) => {
    return new Promise((resolve, reject) => {
      let projRoot = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (projRoot && file_uri) {
        let projRootPath = projRoot.uri.fsPath;
        let encodedProjRootPath: any = projRootPath.replace(/ /g, '%20');
        let strSplit = '/';
        if (
          process &&
          process.platform &&
          process.platform.toLowerCase() === 'win32'
        ) {
          strSplit = '\\';
        }
        let filePathList = file_uri.split(encodedProjRootPath + strSplit);
        if (filePathList && filePathList.length > 1) {
          const relativePattern = new vscode.RelativePattern(
            projRoot,
            `{${filePathList[1]},LICENSE}`
          );
          vscode.workspace.findFiles(relativePattern, null).then(
            (result: vscode.Uri[]) => {
              if (result && result.length) {
                resolve(result);
              } else {
                reject(StatusMessages.NO_SUPPORTED_MANIFEST);
              }
            },
            // rejected
            (reason: any) => {
              vscode.window.showErrorMessage(reason);
              reject(reason);
            }
          );
        } else {
          reject(`Please reopen the file, unable to get filepath`);
        }
      } else {
        reject(`Please reopen the Project, unable to get project path`);
      }
    });
  };

  export const processStackAnalyses = (context, editor) => {
    if (vscode && vscode.window && vscode.window.activeTextEditor) {
      let fileUri: string = editor.document.fileName;
      let workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: StatusMessages.EXT_TITLE
        },
        p => {
          return new Promise((resolve, reject) => {
            p.report({ message: StatusMessages.WIN_RESOLVING_DEPENDENCIES });
            let effectiveF8Var = 'effectivef8Package';
            let argumentList = workspaceFolder;
            if (fileUri.toLowerCase().indexOf('pom.xml') !== -1) {
              effectiveF8Var = 'effectivef8Pom';
              argumentList = editor.document.uri.fsPath;
            } else if (
              fileUri.toLowerCase().indexOf('requirements.txt') !== -1
            ) {
              effectiveF8Var = 'effectivef8Pypi';
            }
            ProjectDataProvider[effectiveF8Var](argumentList)
              .then(async dataEpom => {
                await multimanifestmodule.triggerManifestWs(context);
                return dataEpom;
              })
              .then(async dataEpom => {
                let result = await get_stack_metadata(editor, dataEpom);
                p.report({
                  message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
                });
                return result;
              })
              .then(async result => {
                let formData = await multimanifestmodule.form_manifests_payload(
                  result
                );
                return formData;
              })
              .then(async formData => {
                let payloadData = formData;
                const options = {};
                let thatContext: any;
                options['uri'] = `${
                  Apiendpoint.STACK_API_URL
                }stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                options['formData'] = payloadData;
                options['headers'] = {
                  origin: 'vscode',
                  ecosystem: Apiendpoint.API_ECOSYSTEM
                };
                thatContext = context;
                let respId = await stackAnalysisServices.postStackAnalysisService(
                  options,
                  thatContext
                );
                p.report({
                  message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES
                });
                return respId;
              })
              .then(async respId => {
                console.log(`Analyzing your stack, id ${respId}`);
                const options = {};
                options['uri'] = `${
                  Apiendpoint.STACK_API_URL
                }stack-analyses/${respId}?user_key=${
                  Apiendpoint.STACK_API_USER_KEY
                }`;
                const interval = setInterval(() => {
                  stackAnalysisServices
                    .getStackAnalysisService(options)
                    .then(data => {
                      if (!data.hasOwnProperty('error')) {
                        clearInterval(interval);
                        p.report({
                          message:
                            StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                        });
                        if (DependencyReportPanel.currentPanel) {
                          DependencyReportPanel.currentPanel.doUpdatePanel(
                            data
                          );
                        }
                        resolve();
                      }
                      // keep on waiting
                    })
                    .catch(error => {
                      clearInterval(interval);
                      p.report({
                        message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                      });
                      handleError(error);
                      reject(error);
                    });
                }, 6000);
              })
              .catch(err => {
                p.report({
                  message: StatusMessages.WIN_FAILURE_RESOLVE_DEPENDENCIES
                });
                handleError(err);
                reject();
              });
          });
        }
      );
    } else {
      vscode.window.showInformationMessage(
        `No manifest file is active in editor`
      );
    }
  };

  export const handleError = err => {
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel.doUpdatePanel('error');
    }
    console.log(err);
    vscode.window.showErrorMessage(err);
  };
}
