'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { stackanalysismodule } from './stackanalysismodule';
import { authextension } from './authextension';
import { StatusMessages } from './statusMessages';
import { DependencyReportPanel } from './dependencyReportPanel';

export module multimanifestmodule {
  export const find_manifests_workspace = (workspaceFolder, filesRegex) => {
    return new Promise((resolve, reject) => {
      const relativePattern = new vscode.RelativePattern(
        workspaceFolder,
        `{${filesRegex},LICENSE}`
      );
      vscode.workspace.findFiles(relativePattern, '**/node_modules').then(
        (result: vscode.Uri[]) => {
          if (result && result.length) {
            resolve(result);
          } else {
            reject(`No manifest file found to be analysed`);
          }
        },
        // rejected
        (reason: any) => {
          reject(reason);
        }
      );
    });
  };

  export const form_manifests_payload = (resultList): any => {
    return new Promise((resolve, reject) => {
      let fileReadPromises: Array<any> = [];
      for (let i = 0; i < resultList.length; i++) {
        let fileReadPromise = manifestFileRead(resultList[i]);
        fileReadPromises.push(fileReadPromise);
      }

      Promise.all(fileReadPromises)
        .then(datas => {
          let form_data = {
            'manifest[]': [],
            'filePath[]': [],
            'license[]': [],
            origin: 'lsp'
          };
          datas.forEach(item => {
            if (item.manifest && item.filePath) {
              form_data['manifest[]'].push(item.manifest);
              form_data['filePath[]'].push(item.filePath);
            }
            if (item.hasOwnProperty('license') && item.license.value) {
              form_data['license[]'].push(item.license);
            }
            //TODO : for logging 400 issue
            if (!item.manifest && !item.license) {
              console.log('Manifest is missed', item);
            }
            if (!item.filePath && !item.license) {
              console.log('filePath is missed', item);
            }
          });
          resolve(form_data);
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  export const manifestFileRead = fileContent => {
    let form_data = {
      manifest: '',
      filePath: '',
      license: ''
    };
    let manifestObj: any;
    let manifest_mime_type: any = {
      'requirements.txt': 'text/plain',
      'package.json': 'application/json',
      'pom.xml': 'text/plain',
      'pylist.json': 'application/json',
      'npmlist.json': 'application/json'
    };
    let licenseObj: any;

    let filePath: string = '';
    let filePathList: any = [];
    let projRoot = vscode.workspace.getWorkspaceFolder(fileContent);
    let projRootPath = projRoot.uri.fsPath;
    return new Promise((resolve, reject) => {
      let fsPath: string = fileContent.fsPath ? fileContent.fsPath : '';
      fs.readFile(fsPath, function(err, data) {
        if (data) {
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
          if (!fileContent.fsPath.endsWith('LICENSE')) {
            let filePathSplit = /(\/target|\/stackinfo|\/poms|)/g;
            let strSplit = '/';
            if (
              process &&
              process.platform &&
              process.platform.toLowerCase() === 'win32'
            ) {
              filePathSplit = /(\\target|\\stackinfo|\\poms|)/g;
              strSplit = '\\';
            }
            filePath = fileContent.fsPath
              .split(projRootPath)[1]
              .replace(filePathSplit, '');
            filePathList = filePath.split(strSplit);

            manifestObj.options.filename =
              filePathList[filePathList.length - 1];
            manifestObj.options.contentType =
              manifest_mime_type[filePathList[filePathList.length - 1]];
            manifestObj.value = data.toString();
            form_data['manifest'] = manifestObj;
            if (
              filePath &&
              typeof filePath === 'string' &&
              filePath.indexOf('npmlist') !== -1
            ) {
              form_data['filePath'] = filePath.replace('npmlist', 'package');
            } else if (
              filePath &&
              typeof filePath === 'string' &&
              filePath.indexOf('pylist.json') !== -1
            ) {
              form_data['filePath'] = filePath.replace(
                'pylist.json',
                'requirements.txt'
              );
            } else if (
              filePath &&
              typeof filePath === 'string' &&
              filePath.indexOf('dependencies.txt') !== -1
            ) {
              form_data['filePath'] = filePath.replace(
                'dependencies.txt',
                'pom.xml'
              );
            } else {
              form_data['filePath'] = filePath;
            }
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
  };

  /*
   * Needed async function in order to wait for user selection in case of
   * multi root projects
   */
  export const dependencyAnalyticsReportFlow = async context => {
    let editor = vscode.window.activeTextEditor;
    let workspaceFolder: vscode.WorkspaceFolder;
    if (
      editor &&
      editor.document.fileName &&
      editor.document.fileName.toLowerCase().indexOf('pom.xml') !== -1
    ) {
      workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      stackanalysismodule.processStackAnalyses(
        context,
        workspaceFolder,
        'maven',
        editor
      );
    } else if (
      editor &&
      editor.document.fileName &&
      editor.document.fileName.toLowerCase().indexOf('package.json') !== -1
    ) {
      workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      stackanalysismodule.processStackAnalyses(
        context,
        workspaceFolder,
        'npm',
        editor
      );
    } else if (
      vscode.workspace.hasOwnProperty('workspaceFolders') &&
      vscode.workspace['workspaceFolders'].length > 1
    ) {
      let workspaceFolder = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Pick Workspace Folder...'
      });
      if (workspaceFolder) {
        triggerFullStackAnalyses(context, workspaceFolder);
      } else {
        vscode.window.showInformationMessage(`No Workspace selected.`);
      }
    } else {
      let workspaceFolder = vscode.workspace.workspaceFolders[0];
      triggerFullStackAnalyses(context, workspaceFolder);
    }
  };

  export const triggerFullStackAnalyses = (
    context: vscode.ExtensionContext,
    workspaceFolder: vscode.WorkspaceFolder
  ) => {
    const relativePattern = new vscode.RelativePattern(
      workspaceFolder,
      '{pom.xml,**/package.json}'
    );
    vscode.workspace.findFiles(relativePattern, '**/node_modules').then(
      (result: vscode.Uri[]) => {
        if (result && result.length) {
          // Do not create an effective pom if no pom.xml is present
          let effective_pom_skip = true;
          let ecosystem = 'npm';
          let pom_count = 0;
          result.forEach(item => {
            if (item.fsPath.indexOf('pom.xml') >= 0) {
              effective_pom_skip = false;
              pom_count += 1;
              ecosystem = 'maven';
            }
          });

          if (!effective_pom_skip && pom_count === 0) {
            vscode.window.showInformationMessage(
              'Multi ecosystem support is not yet available.'
            );
            return;
          } else {
            stackanalysismodule.processStackAnalyses(
              context,
              workspaceFolder,
              ecosystem
            );
          }
        } else {
          vscode.window.showInformationMessage(
            StatusMessages.NO_SUPPORTED_MANIFEST
          );
        }
      },
      // Other ecosystem flow
      (reason: any) => {
        vscode.window.showInformationMessage(
          StatusMessages.NO_SUPPORTED_MANIFEST
        );
      }
    );
  };

  export const triggerManifestWs = context => {
    return new Promise((resolve, reject) => {
      authextension
        .authorize_f8_analytics(context)
        .then(data => {
          if (data) {
            DependencyReportPanel.createOrShow(context.extensionPath, null);
            resolve(true);
          }
        })
        .catch(err => {
          reject(`Unable to authenticate.`);
        });
    });
  };
}
