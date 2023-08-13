'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { Config } from './config';
import { snykURL, defaultDependencyAnalysisReportFilePath } from './constants';
import { multimanifestmodule } from './multimanifestmodule';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';
import { DependencyReportPanel } from './dependencyReportPanel';


export module stackanalysismodule {
  export const stackAnalysesLifeCycle = (
    context,
    manifestFilePath,
    ecosystem
  ) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: StatusMessages.EXT_TITLE
      },
      p => {
        return new Promise<void>(async (resolve, reject) => {

          // get config data from extension workspace setting
          const apiConfig = Config.getApiConfig();

          // create webview panel
          await multimanifestmodule.triggerManifestWs(context);
          p.report({
            message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
          });

          // set up configuration options for the stack analysis request
          const options = {};
          if (apiConfig.exhortSnykToken !== '') {
            options['EXHORT_SNYK_TOKEN'] = apiConfig.exhortSnykToken;
          }

          // execute stack analysis
          stackAnalysisServices.exhortApiStackAnalysis(manifestFilePath, options, context)
            .then(resp => {
              p.report({
                message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES
              });
              let reportFilePath = apiConfig.dependencyAnalysisReportFilePath || defaultDependencyAnalysisReportFilePath;
              let reportDirectoryPath = path.dirname(reportFilePath)
              if (!fs.existsSync(reportDirectoryPath)) {
                fs.mkdirSync(reportDirectoryPath, { recursive: true });
              }
              fs.writeFile(reportFilePath, resp, (err) => {
                if (err) {
                  reject(err);
                } else {
                  if (DependencyReportPanel.currentPanel) {
                    DependencyReportPanel.currentPanel.doUpdatePanel(resp);
                  }
                  resolve(null);
                }
              });
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
  };

  export const processStackAnalyses = (
    context,
    workspaceFolder,
    ecosystem,
    uri = null
  ) => {
    let manifestFilePath: string;
    if (ecosystem === 'maven') {
      manifestFilePath = uri
        ? uri.fsPath
        : path.join(workspaceFolder.uri.fsPath, 'pom.xml');
    } else if (ecosystem === 'npm') {
      manifestFilePath = uri
        ? uri.fsPath
        : path.join(workspaceFolder.uri.fsPath, 'package.json');
      // } else if (ecosystem === 'pypi') {
      //   manifestFilePath = uri
      //     ? uri.fsPath.split('requirements.txt')[0]
      //     : workspaceFolder.uri.fsPath;
      // } else if (ecosystem === 'golang') {
      //   manifestFilePath = uri
      //     ? uri.fsPath
      //     : workspaceFolder.uri.fsPath;
    }
    stackAnalysesLifeCycle(context, manifestFilePath, ecosystem);
  };

  export const handleError = err => {
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel.doUpdatePanel('error');
    }
    vscode.window.showErrorMessage(err);
  };

  export const validateSnykToken = async () => {
    const apiConfig = Config.getApiConfig();
    if (apiConfig.exhortSnykToken !== '') {

      // set up configuration options for the token validation request
      let options = {
        'EXHORT_SNYK_TOKEN': apiConfig.exhortSnykToken,
      }

      // execute stack analysis
      stackAnalysisServices.getSnykTokenValidationService(options);

    } else {

      vscode.window.showInformationMessage(`Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, 
                                            Snyk vulnerabilities will not be displayed. 
                                            To resolve this issue, please obtain a valid token from the following link: [here](${snykURL}).`);

    }
  };
}
