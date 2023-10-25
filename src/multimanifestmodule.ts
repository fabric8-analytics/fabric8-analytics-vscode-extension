'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import * as stackanalysismodule from './stackanalysismodule';
import { loadContextData } from './contextHandler';
import { DependencyReportPanel } from './dependencyReportPanel';

export const redhatDependencyAnalyticsReportFlow = async (context, uri) => {
  const supportedFiles = ['pom.xml', 'package.json', 'go.mod', 'requirements.txt'];
  if (
    uri.fsPath && supportedFiles.includes(path.basename(uri.fsPath))
  ) {
    stackanalysismodule.stackAnalysisLifeCycle(
      context,
      uri.fsPath
    );
  } else {
    vscode.window.showInformationMessage(
      `File ${uri.fsPath || ''} is not supported!!`
    );
  }
};

export const triggerManifestWs = context => {
  return new Promise<void>((resolve, reject) => {
    loadContextData(context)
      .then(status => {
        if (status) {
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
    // case 'tidelift':
    //   add Tidelift token validation here...
    //   break;
    // case 'sonatype':
    //   add Sonatype token validation here...
    //   break;
  }
};