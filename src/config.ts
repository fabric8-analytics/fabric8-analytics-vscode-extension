'use strict';

import * as vscode from 'vscode';

import { GlobalState } from './constants';
import * as commands from './commands';
import { getTelemetryId } from './redhatTelemetry';

class Config {
  telemetryId: string;
  triggerFullStackAnalysis: string;
  utmSource: string;
  exhortSnykToken: string;
  exhortOSSIndexUser: string;
  exhortOSSIndexToken: string;
  matchManifestVersions: string;
  exhortMvnPath: string;
  exhortNpmPath: string;
  exhortGoPath: string;
  exhortPython3Path: string;
  exhortPip3Path: string;
  exhortPythonPath: string;
  exhortPipPath: string;
  rhdaReportFilePath: string;

  private readonly DEFAULT_MVN_EXECUTABLE = 'mvn';
  private readonly DEFAULT_NPM_EXECUTABLE = 'npm';
  private readonly DEFAULT_GO_EXECUTABLE = 'go';
  private readonly DEFAULT_PYTHON3_EXECUTABLE = 'python3';
  private readonly DEFAULT_PIP3_EXECUTABLE = 'pip3';
  private readonly DEFAULT_PYTHON_EXECUTABLE = 'python';
  private readonly DEFAULT_PIP_EXECUTABLE = 'pip';

  /**
   * Initializes a new instance of the EnvironmentData class with default extension workspace settings.
   */
  constructor() {
    this.loadData();
    this.setProcessEnv();
  }

  private getApiConfig(): any {
    return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
  }

  private getExecutableConfig(exe: string): string {
    const exePath: string = vscode.workspace
      .getConfiguration(`${exe}.executable`)
      .get<string>('path');
    return exePath ? exePath : exe;
  }

  loadData() {
    const apiConfig = this.getApiConfig();

    this.triggerFullStackAnalysis = commands.TRIGGER_FULL_STACK_ANALYSIS;
    this.utmSource = GlobalState.UTM_SOURCE;
    this.exhortSnykToken = apiConfig.exhortSnykToken;
    this.exhortOSSIndexUser = apiConfig.exhortOSSIndexUser;
    this.exhortOSSIndexToken = apiConfig.exhortOSSIndexToken;
    this.matchManifestVersions = apiConfig.matchManifestVersions ? 'true' : 'false';
    this.rhdaReportFilePath = apiConfig.redHatDependencyAnalyticsReportFilePath;
    this.exhortMvnPath = this.getExecutableConfig(this.DEFAULT_MVN_EXECUTABLE);
    this.exhortNpmPath = this.getExecutableConfig(this.DEFAULT_NPM_EXECUTABLE);
    this.exhortGoPath = this.getExecutableConfig(this.DEFAULT_GO_EXECUTABLE);
    this.exhortPython3Path = this.getExecutableConfig(this.DEFAULT_PYTHON3_EXECUTABLE);
    this.exhortPip3Path = this.getExecutableConfig(this.DEFAULT_PIP3_EXECUTABLE);
    this.exhortPythonPath = this.getExecutableConfig(this.DEFAULT_PYTHON_EXECUTABLE);
    this.exhortPipPath = this.getExecutableConfig(this.DEFAULT_PIP_EXECUTABLE);
  }

  private setProcessEnv() {
    process.env['VSCEXT_TRIGGER_FULL_STACK_ANALYSIS'] = this.triggerFullStackAnalysis;
    process.env['VSCEXT_UTM_SOURCE'] = this.utmSource;
    process.env['VSCEXT_EXHORT_SNYK_TOKEN'] = this.exhortSnykToken;
    process.env['VSCEXT_EXHORT_OSS_INDEX_USER'] = this.exhortOSSIndexUser;
    process.env['VSCEXT_EXHORT_OSS_INDEX_TOKEN'] = this.exhortOSSIndexToken;
    process.env['VSCEXT_MATCH_MANIFEST_VERSIONS'] = this.matchManifestVersions;
    process.env['VSCEXT_EXHORT_MVN_PATH'] = this.exhortMvnPath;
    process.env['VSCEXT_EXHORT_NPM_PATH'] = this.exhortNpmPath;
    process.env['VSCEXT_EXHORT_GO_PATH'] = this.exhortGoPath;
    process.env['VSCEXT_EXHORT_PYTHON3_PATH'] = this.exhortPython3Path;
    process.env['VSCEXT_EXHORT_PIP3_PATH'] = this.exhortPip3Path;
    process.env['VSCEXT_EXHORT_PYTHON_PATH'] = this.exhortPythonPath;
    process.env['VSCEXT_EXHORT_PIP_PATH'] = this.exhortPipPath;
    process.env['EXHORT_DEV_MODE'] = GlobalState.EXHORT_DEV_MODE;
  }

  async authorizeRHDA(context) {
    this.telemetryId = await getTelemetryId(context);
    process.env['VSCEXT_TELEMETRY_ID'] = this.telemetryId;
  }
}

const globalConfig = new Config();

export { globalConfig };

