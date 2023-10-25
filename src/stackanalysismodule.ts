'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import * as config from './config';
import { snykURL, defaultRedhatDependencyAnalyticsReportFilePath, StatusMessages, Titles } from './constants';
import * as multimanifestmodule from './multimanifestmodule';
import * as stackAnalysisServices from './stackAnalysisService';
import { DependencyReportPanel } from './dependencyReportPanel';

export const stackAnalysisLifeCycle = (
  context,
  manifestFilePath,
) => {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: Titles.EXT_TITLE
    },
    p => {
      return new Promise<void>(async (resolve, reject) => {

        // get config data from extension workspace setting
        const apiConfig = config.getApiConfig();

        // create webview panel
        await multimanifestmodule.triggerManifestWs(context);
        p.report({
          message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
        });

        // set up configuration options for the stack analysis request
        const options = {
          'RHDA_TOKEN': process.env.VSCEXT_TELEMETRY_ID,
          'RHDA_SOURCE': process.env.VSCEXT_UTM_SOURCE,
          'EXHORT_DEV_MODE': process.env.VSCEXT_EXHORT_DEV_MODE,
          'MATCH_MANIFEST_VERSIONS': apiConfig.matchManifestVersions ? 'true' : 'false',
          'EXHORT_MVN_PATH': config.getMvnExecutable(),
          'EXHORT_NPM_PATH': config.getNpmExecutable(),
          'EXHORT_GO_PATH': config.getGoExecutable(),
          'EXHORT_PYTHON3_PATH': config.getPython3Executable(),
          'EXHORT_PIP3_PATH': config.getPip3Executable(),
          'EXHORT_PYTHON_PATH': config.getPythonExecutable(),
          'EXHORT_PIP_PATH': config.getPipExecutable()
        };

        if (apiConfig.exhortSnykToken !== '') {
          options['EXHORT_SNYK_TOKEN'] = apiConfig.exhortSnykToken;
        }

        // execute stack analysis
        stackAnalysisServices.exhortApiStackAnalysis(manifestFilePath, options)
          .then(resp => {
            p.report({
              message: StatusMessages.WIN_GENERATING_DEPENDENCIES
            });
            const reportFilePath = apiConfig.redHatDependencyAnalyticsReportFilePath || defaultRedhatDependencyAnalyticsReportFilePath;
            const reportDirectoryPath = path.dirname(reportFilePath);
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
                p.report({
                  message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS
                });
                resolve(null);
              }
            });
          })
          .catch(err => {
            p.report({
              message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS
            });
            handleError(err);
            reject();
          });
      });
    }
  );
};

export const handleError = err => {
  if (DependencyReportPanel.currentPanel) {
    DependencyReportPanel.currentPanel.doUpdatePanel('error');
  }
  vscode.window.showErrorMessage(err.message);
};

export const validateSnykToken = async () => {
  const apiConfig = config.getApiConfig();
  if (apiConfig.exhortSnykToken !== '') {

    // set up configuration options for the token validation request
    const options = {
      'RHDA_TOKEN': process.env.VSCEXT_TELEMETRY_ID,
      'RHDA_SOURCE': process.env.VSCEXT_UTM_SOURCE,
      'EXHORT_DEV_MODE': process.env.VSCEXT_EXHORT_DEV_MODE,
      'EXHORT_SNYK_TOKEN': apiConfig.exhortSnykToken
    };

    // execute stack analysis
    stackAnalysisServices.getSnykTokenValidationService(options);

  } else {

    vscode.window.showInformationMessage(`Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, 
                                            Snyk vulnerabilities will not be displayed. 
                                            To resolve this issue, please obtain a valid token from the following link: [here](${snykURL}).`);

  }
};
