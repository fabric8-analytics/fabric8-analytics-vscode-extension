'use strict';

import * as vscode from 'vscode';

import { stackanalysismodule } from './stackanalysismodule';
import { authextension } from './authextension';
import { StatusMessages } from './constants';
import { DependencyReportPanel } from './dependencyReportPanel';

export module multimanifestmodule {
  /*
   * Needed async function in order to wait for user selection in case of
   * multi root projects
   */
  export const redhatDependencyAnalyticsReportFlow = async (context, uri) => {
    let workspaceFolder: vscode.WorkspaceFolder;
    if (uri && uri.scheme && uri.scheme === 'file') {
      if (
        uri.fsPath &&
        uri.fsPath.toLowerCase().indexOf('pom.xml') !== -1
      ) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        stackanalysismodule.processStackAnalysis(
          context,
          workspaceFolder,
          'maven',
          uri
        );
      } else if (
        uri.fsPath &&
        uri.fsPath.toLowerCase().indexOf('package.json') !== -1
      ) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        stackanalysismodule.processStackAnalysis(
          context,
          workspaceFolder,
          'npm',
          uri
        );
        // } else if (
        //   uri.fsPath &&
        //   uri.fsPath.toLowerCase().indexOf('requirements.txt') !== -1
        // ) {
        //   workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        //   stackanalysismodule.processStackAnalysis(
        //     context,
        //     workspaceFolder,
        //     'pypi',
        //     uri
        //   );
        // } else if (
        //   uri.fsPath &&
        //   uri.fsPath.toLowerCase().indexOf('go.mod') !== -1
        // ) {
        //   workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        //   stackanalysismodule.processStackAnalysis(
        //     context,
        //     workspaceFolder,
        //     'golang',
        //     uri
        //   );
      } else {
        vscode.window.showInformationMessage(
          `File ${uri.fsPath} is not supported!!`
        );
      }
    } else if (
      vscode.workspace.hasOwnProperty('workspaceFolders') &&
      vscode.workspace['workspaceFolders'].length > 1
    ) {
      let workspaceFolder = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Pick Workspace Folder...'
      });
      if (workspaceFolder) {
        triggerFullStackAnalysis(context, workspaceFolder);
      } else {
        vscode.window.showInformationMessage(`No Workspace selected.`);
      }
    } else {
      let workspaceFolder = vscode.workspace.workspaceFolders[0];
      triggerFullStackAnalysis(context, workspaceFolder);
    }
  };

  export const triggerFullStackAnalysis = (
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
            stackanalysismodule.processStackAnalysis(
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

  export const triggerTokenValidation = async (provider) => {
    switch (provider) {
      case 'snyk':
        stackanalysismodule.validateSnykToken();
        break;
      case 'tidelift':
        // add Tidelift token validation here...
        break;
      case 'sonatype':
        // add Sonatype token validation here...
        break;
    }
  };

}
