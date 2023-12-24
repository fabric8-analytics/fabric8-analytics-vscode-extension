'use strict';

import * as vscode from 'vscode';

import { GlobalState, defaultRhdaReportFilePath } from './constants';
import * as commands from './commands';
import { getTelemetryId } from './redhatTelemetry';

/**
 * Represents the configuration settings for the extension.
 */
class Config {
  telemetryId: string;
  triggerFullStackAnalysis: string;
  triggerRHRepositoryRecommendationNotification: string;
  utmSource: string;
  exhortSnykToken: string;
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
   * Creates an instance of the Config class.
   * Initializes the instance with default extension settings.
   */
  constructor() {
    this.loadData();
    this.setProcessEnv();
  }

  /**
   * Retrieves RHDA configuration settings.
   * @returns The RHDA configuration settings.
   * @private
   */
  private getRhdaConfig(): any {
    return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
  }

  /**
   * Loads configuration settings.
   */
  loadData() {
    const rhdaConfig = this.getRhdaConfig();

    this.triggerFullStackAnalysis = commands.TRIGGER_FULL_STACK_ANALYSIS;
    this.triggerRHRepositoryRecommendationNotification = commands.TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION;
    this.utmSource = GlobalState.UTM_SOURCE;
    this.exhortSnykToken = rhdaConfig.exhortSnykToken;
    this.matchManifestVersions = rhdaConfig.matchManifestVersions ? 'true' : 'false';
    this.rhdaReportFilePath = rhdaConfig.redHatDependencyAnalyticsReportFilePath || defaultRhdaReportFilePath;
    this.exhortMvnPath = rhdaConfig.mvn.executable.path || this.DEFAULT_MVN_EXECUTABLE;
    this.exhortNpmPath = rhdaConfig.npm.executable.path || this.DEFAULT_NPM_EXECUTABLE;
    this.exhortGoPath = rhdaConfig.go.executable.path || this.DEFAULT_GO_EXECUTABLE;
    this.exhortPython3Path = rhdaConfig.python3.executable.path || this.DEFAULT_PYTHON3_EXECUTABLE;
    this.exhortPip3Path = rhdaConfig.pip3.executable.path || this.DEFAULT_PIP3_EXECUTABLE;
    this.exhortPythonPath = rhdaConfig.python.executable.path || this.DEFAULT_PYTHON_EXECUTABLE;
    this.exhortPipPath = rhdaConfig.pip.executable.path || this.DEFAULT_PIP_EXECUTABLE;
  }

  /**
   * Sets process environment variables based on configuration settings.
   * @private
   */
  private setProcessEnv() {
    process.env['VSCEXT_TRIGGER_FULL_STACK_ANALYSIS'] = this.triggerFullStackAnalysis;
    process.env['VSCEXT_TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION'] = this.triggerRHRepositoryRecommendationNotification;
    process.env['VSCEXT_UTM_SOURCE'] = this.utmSource;
    process.env['VSCEXT_EXHORT_SNYK_TOKEN'] = this.exhortSnykToken;
    process.env['VSCEXT_MATCH_MANIFEST_VERSIONS'] = this.matchManifestVersions;
    process.env['VSCEXT_EXHORT_MVN_PATH'] = this.exhortMvnPath;
    process.env['VSCEXT_EXHORT_NPM_PATH'] = this.exhortNpmPath;
    process.env['VSCEXT_EXHORT_GO_PATH'] = this.exhortGoPath;
    process.env['VSCEXT_EXHORT_PYTHON3_PATH'] = this.exhortPython3Path;
    process.env['VSCEXT_EXHORT_PIP3_PATH'] = this.exhortPip3Path;
    process.env['VSCEXT_EXHORT_PYTHON_PATH'] = this.exhortPythonPath;
    process.env['VSCEXT_EXHORT_PIP_PATH'] = this.exhortPipPath;
  }

  /**
   * Authorizes the RHDA (Red Hat Dependency Analytics) service.
   * @param context The extension context for authorization.
   */
  async authorizeRHDA(context) {
    this.telemetryId = await getTelemetryId(context);
    process.env['VSCEXT_TELEMETRY_ID'] = this.telemetryId;
  }
}

/**
 * The global configuration object for the extension.
 */
const globalConfig = new Config();

export { globalConfig };

