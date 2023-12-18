'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { StatusMessages, Titles } from './constants';
import { stackAnalysisService } from './exhortServices';
import { DependencyReportPanel } from './dependencyReportPanel';
import { globalConfig } from './config';

const supportedFiles = [
  'pom.xml',
  'package.json',
  'go.mod',
  'requirements.txt'
];

/**
 * Updates the webview panel with data.
 * @param data The data to update the panel with.
 */
function updateWebviewPanel(data) {
  if (DependencyReportPanel.currentPanel) {
    DependencyReportPanel.currentPanel.doUpdatePanel(data);
  }
}

/**
 * Writes the report data to a file.
 * @param data The data to write to the file.
 * @returns A promise that resolves once the file is written.
 */
function writeReportToFile(data) {
  return new Promise<void>((resolve, reject) => {
    const reportFilePath = globalConfig.rhdaReportFilePath;
    const reportDirectoryPath = path.dirname(reportFilePath);

    if (!fs.existsSync(reportDirectoryPath)) {
      fs.mkdirSync(reportDirectoryPath, { recursive: true });
    }

    fs.writeFile(reportFilePath, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Executes the RHDA stack analysis process.
 * @param manifestFilePath The file path to the manifest file for analysis.
 * @returns The stack analysis response string.
 */
async function executeStackAnalysis(manifestFilePath): Promise<string> {
  try {
    return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
      return new Promise<string>(async (resolve, reject) => {
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

        // execute stack analysis
        await stackAnalysisService(manifestFilePath, options)
          .then(async (resp) => {
            p.report({
              message: StatusMessages.WIN_GENERATING_DEPENDENCIES
            });

            updateWebviewPanel(resp);

            p.report({
              message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS
            });

            resolve(resp);
          })
          .catch(err => {
            p.report({
              message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS
            });

            reject(err);
          });
      });
    });
  } catch (err) {
    updateWebviewPanel('error');
    throw (err);
  }
}

/**
 * Triggers the webview panel display.
 * @param context The extension context.
 * @returns A Promise that resolves once the webview panel has been triggered.
 */
async function triggerWebviewPanel(context) {
  await globalConfig.authorizeRHDA(context);
  DependencyReportPanel.createOrShowWebviewPanel();
}

/**
 * Generates the RHDA report based on the provided manifest URI.
 * @param context The extension context.
 * @param uri The URI of the manifest file for analysis.
 * @returns A promise that resolves once the report generation is complete.
 */
async function generateRHDAReport(context, uri) {
  if (uri.fsPath && supportedFiles.includes(path.basename(uri.fsPath))) {
    try {

      await triggerWebviewPanel(context);
      const resp = await executeStackAnalysis(uri.fsPath);
      if (DependencyReportPanel.currentPanel) {
        await writeReportToFile(resp);
      }

    } catch (error) {
      throw (error);
    }
  } else {
    vscode.window.showInformationMessage(
      `File ${uri.fsPath} is not supported!!`
    );
  }
}

export { generateRHDAReport };