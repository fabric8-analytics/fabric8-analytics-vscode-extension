'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { executeStackAnalysis } from './stackAnalysis';
import { DependencyReportPanel } from './dependencyReportPanel';
import { globalConfig } from './config';
import { executeDockerImageAnalysis } from './imageAnalysis';
import { DepOutputChannel } from './depOutputChannel';
import { ResponseMetrics } from './dependencyAnalysis/analysis';
import parse from 'node-html-parser';
import { AnalysisReport } from '@trustification/exhort-api-spec/model/v4/AnalysisReport';
import { isDefined } from './utils';

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
async function generateRHDAReport(context: vscode.ExtensionContext, filePath: string, outputChannel: DepOutputChannel): Promise<ResponseMetrics | undefined> {
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

    return metricsFromReport(resp);
  } else {
    vscode.window.showInformationMessage(`File ${filePath} is not supported.`);
  }

  return;
}

function metricsFromReport(report: string): ResponseMetrics | undefined {
  const html = parse(report);
  const merticsElement = html.querySelectorAll('head > script').find(element => element.innerText.trim().startsWith('window["appData"]='));
  if (!merticsElement) {
    return;
  }

  let metricsJS = merticsElement.innerText.trim().substring('window["appData"]='.length);
  metricsJS = metricsJS.substring(0, metricsJS.length - 1);
  const rawMetrics = JSON.parse(metricsJS)['report'] as AnalysisReport;

  const scanned = rawMetrics.scanned || {};
  const providers = rawMetrics.providers || {};

  const mappedProviders: ResponseMetrics['providers'] = {};
  for (const [providerName, providerData] of Object.entries(providers)) {
    mappedProviders[providerName] = {};
    if (isDefined(providerData, 'sources')) {
      for (const [sourceName, sourceData] of Object.entries(providerData.sources)) {
        if (isDefined(sourceData, 'summary')) {
          const source = sourceData;
          mappedProviders[providerName][sourceName] = {
            total: source.summary.total ?? 0,
            direct: source.summary.direct ?? 0,
            transitive: source.summary.transitive ?? 0,
            dependencies: source.summary.dependencies ?? 0,
            critical: source.summary.critical ?? 0,
            high: source.summary.high ?? 0,
            medium: source.summary.medium ?? 0,
            low: source.summary.low ?? 0,
            remediations: source.summary.remediations ?? 0,
            recommendations: source.summary.recommendations ?? 0,
          };
        }
      }
    }
  }

  return {
    scanned: {
      total: scanned.total ?? 0,
      direct: scanned.direct ?? 0,
      transitive: scanned.transitive ?? 0,
    },
    providers: mappedProviders,
  };
}

export { generateRHDAReport, updateCurrentWebviewPanel };