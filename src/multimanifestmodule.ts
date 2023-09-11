'use strict';

import * as vscode from 'vscode';

import { stackanalysismodule } from './stackanalysismodule';
import { authextension } from './authextension';
import { DependencyReportPanel } from './dependencyReportPanel';

export module multimanifestmodule {
  export const redhatDependencyAnalyticsReportFlow = async (context, uri) => {
    let workspaceFolder: vscode.WorkspaceFolder;
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
    } else if (
      uri.fsPath &&
      uri.fsPath.toLowerCase().indexOf('go.mod') !== -1
    ) {
      workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      stackanalysismodule.processStackAnalysis(
        context,
        workspaceFolder,
        'golang',
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
    } else {
      vscode.window.showInformationMessage(
        `File ${uri.fsPath} is not supported!!`
      );
    }
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
