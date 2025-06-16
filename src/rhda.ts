'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { executeStackAnalysis } from './stackAnalysis';
import { DependencyReportPanel } from './dependencyReportPanel';
import { globalConfig } from './config';
import { executeDockerImageAnalysis } from './imageAnalysis';
import { DepOutputChannel } from './depOutputChannel';

/**
 * Represents supported file types for analysis.
 */
type supportedFileTypes = 'go' | 'maven' | 'npm' | 'python' | 'gradle' | 'docker';

/**
 * Represents supported file names for analysis.
 */
const GO_MOD = 'go.mod';
const POM_XML = 'pom.xml';
const PACKAGE_JSON = 'package.json';
const REQUIREMENTS_TXT = 'requirements.txt';
const BUILD_GRADLE = 'build.gradle';
const DOCKERFILE = 'Dockerfile';
const CONTAINERFILE = 'Containerfile';

/**
 * Determines the type of the provided file based on its name.
 * @param filePath The path of the file to determine its type.
 * @returns A supported file type if the file is recognized, otherwise undefined.
 */
function getFileType(filePath: string): supportedFileTypes | undefined {
  const basename = path.basename(filePath);
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
  else if (basename === BUILD_GRADLE) {
    return 'gradle';
  }
  else if (basename === DOCKERFILE || basename === CONTAINERFILE) {
    return 'docker';
  }

  return undefined;
}

/**
 * Triggers the webview panel display.
 * @param context The extension context.
 * @returns A Promise that resolves once the webview panel has been triggered.
 */
async function triggerWebviewPanel(context: vscode.ExtensionContext) {
  await globalConfig.authorizeRHDA(context);
  DependencyReportPanel.createOrShowWebviewPanel();
}

/**
 * Updates the webview panel with data.
 * @param data The data to update the panel with.
 */
function updateCurrentWebviewPanel(data: any) {
  /* istanbul ignore else */
  if (DependencyReportPanel.currentPanel) {
    DependencyReportPanel.currentPanel.doUpdatePanel(data);
  }
}

/**
 * Writes the report data to a file.
 * @param data The data to write to the file.
 */
async function writeReportToFile(data: string) {
  const reportFilePath = globalConfig.rhdaReportFilePath;
  const reportDirectoryPath = path.dirname(reportFilePath);

  if (!fs.existsSync(reportDirectoryPath)) {
    fs.mkdirSync(reportDirectoryPath, { recursive: true });
  }

  await fs.promises.writeFile(reportFilePath, data);
}

/**
 * Generates the RHDA report based on the provided file.
 * @param context The extension context.
 * @param filePath The path of the file for analysis.
 * @returns A promise that resolves once the report generation is complete.
 */
async function generateRHDAReport(context: vscode.ExtensionContext, filePath: string, outputChannel: DepOutputChannel) {
  const fileType = getFileType(filePath);
  if (fileType) {
    await triggerWebviewPanel(context);
    let resp: string;
    if (fileType === 'docker') {
      resp = await executeDockerImageAnalysis(filePath, outputChannel);
    } else {
      resp = await executeStackAnalysis(filePath, outputChannel);
    }
    /* istanbul ignore else */
    if (DependencyReportPanel.currentPanel) {
      await writeReportToFile(resp);
    }
  } else {
    vscode.window.showInformationMessage(`File ${filePath} is not supported.`);
  }
}

export { generateRHDAReport, updateCurrentWebviewPanel };