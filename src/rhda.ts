'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { executeStackAnalysis } from './stackAnalysis';
import { DependencyReportPanel } from './dependencyReportPanel';
import { globalConfig } from './config';
import { executeDockerImageAnalysis } from './imageAnalysis';

type supportedFileTypes = 'go' | 'maven' | 'npm' | 'python' | 'docker';

const GO_MOD = 'go.mod';
const POM_XML = 'pom.xml';
const PACKAGE_JSON = 'package.json';
const REQUIREMENTS_TXT = 'requirements.txt';
const DOCKERFILE = 'Dockerfile';

function getFileType(file: string): supportedFileTypes | undefined {
  const basename = path.basename(file);
  if (basename === GO_MOD) {
    return 'go';
  }
  else if (basename === POM_XML) {
    return 'maven';
  }
  else if (basename === PACKAGE_JSON) {
    return 'npm';
  }
  else if (basename === REQUIREMENTS_TXT) {
    return 'python';
  }
  else if (basename === DOCKERFILE) {
    return 'docker';
  }

  return undefined;
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
 * Updates the webview panel with data.
 * @param data The data to update the panel with.
 */
function updateCurrentWebviewPanel(data) {
  /* istanbul ignore else */
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
 * Generates the RHDA report based on the provided manifest URI.
 * @param context The extension context.
 * @param uri The URI of the manifest file for analysis.
 * @returns A promise that resolves once the report generation is complete.
 */
async function generateRHDAReport(context, filePath) {
  const fileType = getFileType(filePath);
  if (fileType) {
    try {

      await triggerWebviewPanel(context);
      let resp: string;
      if (fileType === 'docker') {
        resp = await executeDockerImageAnalysis(filePath);
      } else {
        resp = await executeStackAnalysis(filePath);
      }
      /* istanbul ignore else */
      if (DependencyReportPanel.currentPanel) {
        await writeReportToFile(resp);
      }

    } catch (error) {
      throw (error);
    }
  } else {
    vscode.window.showInformationMessage(
      `File ${filePath} is not supported!!`
    );
  }
}

export { generateRHDAReport, updateCurrentWebviewPanel };