'use strict';

import * as vscode from 'vscode';

import * as stackanalysismodule from './stackanalysismodule';
import { initContextData } from './authextension';
import { DependencyReportPanel } from './dependencyReportPanel';

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
  } else if (
    uri.fsPath &&
    uri.fsPath.toLowerCase().indexOf('requirements.txt') !== -1
  ) {
    workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    stackanalysismodule.processStackAnalysis(
      context,
      workspaceFolder,
      'pypi',
      uri
    );
  } else {
    vscode.window.showInformationMessage(
      `File ${uri.fsPath} is not supported!!`
    );
  }
};

export const triggerManifestWs = context => {
  return new Promise<void>((resolve, reject) => {
    initContextData(context)
      .then(data => {
        if (data) {
          DependencyReportPanel.createOrShowWebviewPanel();
          resolve();
        }
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