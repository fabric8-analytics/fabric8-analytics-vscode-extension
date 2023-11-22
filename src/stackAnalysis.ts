'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { defaultRhdaReportFilePath, StatusMessages, Titles } from './constants';
import { stackAnalysisService } from './exhortServices';
import { DependencyReportPanel } from './dependencyReportPanel';
import { globalConfig } from './config';

const supportedFiles = [
  'pom.xml',
  'package.json',
  'go.mod',
  'requirements.txt'
];

function updateWebviewPanel(data) {
  if (DependencyReportPanel.currentPanel) {
    DependencyReportPanel.currentPanel.doUpdatePanel(data);
  }
}

function writeReportToFile(resp) {
  return new Promise<void>((resolve, reject) => {
    const reportFilePath = globalConfig.rhdaReportFilePath || defaultRhdaReportFilePath;
    const reportDirectoryPath = path.dirname(reportFilePath);

    if (!fs.existsSync(reportDirectoryPath)) {
      fs.mkdirSync(reportDirectoryPath, { recursive: true });
    }

    fs.writeFile(reportFilePath, resp, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function executeStackAnalysis(manifestFilePath) {
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          p.report({
            message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
          });

          // set up configuration options for the stack analysis request
          const options = {
            'RHDA_TOKEN': globalConfig.telemetryId,
            'RHDA_SOURCE': globalConfig.utmSource,
            'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
            'EXHORT_MVN_PATH': globalConfig.exhortMvnPath,
            'EXHORT_NPM_PATH': globalConfig.exhortNpmPath,
            'EXHORT_GO_PATH': globalConfig.exhortGoPath,
            'EXHORT_PYTHON3_PATH': globalConfig.exhortPython3Path,
            'EXHORT_PIP3_PATH': globalConfig.exhortPip3Path,
            'EXHORT_PYTHON_PATH': globalConfig.exhortPythonPath,
            'EXHORT_PIP_PATH': globalConfig.exhortPipPath
          };

          if (globalConfig.exhortSnykToken !== '') {
            options['EXHORT_SNYK_TOKEN'] = globalConfig.exhortSnykToken;
          }

          if (globalConfig.exhortOSSIndexUser !== '' && globalConfig.exhortOSSIndexToken !== '') {
            options['EXHORT_OSS_INDEX_USER'] = globalConfig.exhortOSSIndexUser;
            options['EXHORT_OSS_INDEX_TOKEN'] = globalConfig.exhortOSSIndexToken;
          }

          // execute stack analysis
          await stackAnalysisService(manifestFilePath, options)
            .then(async (resp) => {
              p.report({
                message: StatusMessages.WIN_GENERATING_DEPENDENCIES
              });

              await writeReportToFile(resp);
              updateWebviewPanel(resp);

              p.report({
                message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS
              });

              resolve();
            })
            .catch(err => {
              p.report({
                message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS
              });

              reject(err);
            });
        } catch (err) {
          p.report({
            message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
          });

          reject(err);
        }
      });
    });
  } catch (err) {
    throw (err);
  }
}

async function triggerWebviewPanel(context) {
  await globalConfig.authorizeRHDA(context);
  DependencyReportPanel.createOrShowWebviewPanel();
}

async function generateRHDAReport(context, uri) {
  if (uri.fsPath && supportedFiles.includes(path.basename(uri.fsPath))) {
    try {

      await triggerWebviewPanel(context);
      await executeStackAnalysis(uri.fsPath);

    } catch (error) {
      updateWebviewPanel('error');
      throw (error);
    }
  } else {
    vscode.window.showInformationMessage(
      `File ${uri.fsPath} is not supported!!`
    );
  }
}

export { generateRHDAReport };