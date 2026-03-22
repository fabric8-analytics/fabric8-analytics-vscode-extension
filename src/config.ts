'use strict';

import * as vscode from 'vscode';

import { GlobalState, DEFAULT_RHDA_REPORT_FILE_PATH } from './constants';
import * as commands from './commands';
import { getTelemetryId } from './redhatTelemetry';
import { Minimatch } from 'minimatch';

/**
 * Represents the configuration settings for the extension.
 */
class Config {
  telemetryId: string | undefined;
  backendUrl: string | undefined;
  stackAnalysisCommand!: string;
  trackRecommendationAcceptanceCommand!: string;
  recommendationsEnabled!: boolean;
  utmSource!: string;
  exhortProxyUrl!: string;
  matchManifestVersions!: string;
  usePythonVirtualEnvironment!: string;
  useGoMVS!: string;
  enablePythonBestEffortsInstallation!: string;
  usePipDepTree!: string;
  vulnerabilityAlertSeverity!: string;
  oidcRealmUrl!: string;
  oidcClientId!: string;
  oidcAllowInsecure!: boolean;
  exhortMvnPath!: string;
  exhortPreferMvnw!: string;
  exhortMvnArgs!: string;
  exhortGradlePath!: string;
  exhortPreferGradlew!: string;
  exhortNpmPath!: string;
  exhortPnpmPath!: string;
  exhortYarnPath!: string;
  exhortGoPath!: string;
  exhortPython3Path!: string;
  exhortPip3Path!: string;
  exhortPythonPath!: string;
  exhortPipPath!: string;
  exhortCargoPath!: string;
  rhdaReportFilePath!: string;
  secrets!: vscode.SecretStorage;
  exhortSyftPath!: string;
  exhortSyftConfigPath!: string;
  exhortSkopeoPath!: string;
  exhortSkopeoConfigPath!: string;
  exhortDockerPath!: string;
  exhortPodmanPath!: string;
  exhortImagePlatform!: string;
  excludePatterns!: Minimatch[];
  licenseCheckEnabled!: boolean;

  private readonly DEFAULT_MVN_EXECUTABLE = 'mvn';
  private readonly DEFAULT_GRADLE_EXECUTABLE = 'gradle';
  private readonly DEFAULT_NPM_EXECUTABLE = 'npm';
  private readonly DEFAULT_PNPM_EXECUTABLE = 'pnpm';
  private readonly DEFAULT_YARN_EXECUTABLE = 'yarn';
  private readonly DEFAULT_GO_EXECUTABLE = 'go';
  private readonly DEFAULT_PYTHON3_EXECUTABLE = 'python3';
  private readonly DEFAULT_PIP3_EXECUTABLE = 'pip3';
  private readonly DEFAULT_PYTHON_EXECUTABLE = 'python';
  private readonly DEFAULT_PIP_EXECUTABLE = 'pip';
  private readonly DEFAULT_CARGO_EXECUTABLE = 'cargo';
  private readonly DEFAULT_SYFT_EXECUTABLE = 'syft';
  private readonly DEFAULT_SKOPEO_EXECUTABLE = 'skopeo';
  private readonly DEFAULT_DOCKER_EXECUTABLE = 'docker';
  private readonly DEFAULT_PODMAN_EXECUTABLE = 'podman';
  private readonly DEFAULT_EXHORT_DEV_URL = 'https://exhort.stage.devshift.net';
  private readonly DEFAULT_EXHORT_PROD_URL = 'https://rhda.rhcloud.com';

  /**
   * Creates an instance of the Config class.
   * Initializes the instance with default extension settings.
   */
  constructor() {
    this.loadData();
  }

  /**
   * Retrieves RHDA configuration settings.
   * @returns The RHDA configuration settings.
   * @private
   */
  private getRhdaConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
  }

  /**
   * Loads configuration settings.
   */
  loadData() {
    const rhdaConfig = this.getRhdaConfig();

    const rhdaPreferMavenWrapper = vscode.workspace.getConfiguration('redHatDependencyAnalytics.mvn').get('preferWrapper') as 'true' | 'false' | 'fallback';
    const msftPreferMavenWrapper = vscode.workspace.getConfiguration('maven.executable').get('preferMavenWrapper', true);
    const preferMavenWrapper = rhdaPreferMavenWrapper === 'fallback' ? msftPreferMavenWrapper : rhdaPreferMavenWrapper === 'true';

    const rhdaPreferGradleWrapper = vscode.workspace.getConfiguration('redHatDependencyAnalytics.gradle').get('preferWrapper') as 'true' | 'false' | 'fallback';
    const redhatPreferGradleWrapper = vscode.workspace.getConfiguration('java.import.gradle.wrapper').get('enabled', true);
    const preferGradleWrapper = rhdaPreferGradleWrapper === 'fallback' ? redhatPreferGradleWrapper : rhdaPreferGradleWrapper === 'true';

    const defaultBackendUrl = process.env['TRUSTIFY_DA_DEV_MODE'] === 'true' ? this.DEFAULT_EXHORT_DEV_URL : this.DEFAULT_EXHORT_PROD_URL;

    this.stackAnalysisCommand = commands.STACK_ANALYSIS_COMMAND;
    this.trackRecommendationAcceptanceCommand = commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND;
    this.recommendationsEnabled = rhdaConfig.get('recommendations.enabled', true);
    this.utmSource = GlobalState.UTM_SOURCE;
    this.backendUrl = rhdaConfig.get('backendUrl') || defaultBackendUrl;
    this.exhortProxyUrl = this.getEffectiveHttpProxyUrl();
    /* istanbul ignore next */
    this.matchManifestVersions = rhdaConfig.get('matchManifestVersions', true) ? 'true' : 'false';
    /* istanbul ignore next */
    this.usePythonVirtualEnvironment = rhdaConfig.get('usePythonVirtualEnvironment', false) ? 'true' : 'false';
    /* istanbul ignore next */
    this.useGoMVS = rhdaConfig.get('useGoMVS', true) ? 'true' : 'false';
    /* istanbul ignore next */
    this.enablePythonBestEffortsInstallation = rhdaConfig.get('enablePythonBestEffortsInstallation', false) ? 'true' : 'false';
    /* istanbul ignore next */
    this.usePipDepTree = rhdaConfig.get('usePipDepTree', false) ? 'true' : 'false';
    this.vulnerabilityAlertSeverity = rhdaConfig.get('vulnerabilityAlertSeverity', 'Error');
    /* istanbul ignore next */
    this.rhdaReportFilePath = rhdaConfig.get('reportFilePath') || DEFAULT_RHDA_REPORT_FILE_PATH;
    this.exhortMvnPath = rhdaConfig.get('mvn.executable.path') || this.DEFAULT_MVN_EXECUTABLE;
    this.exhortPreferMvnw = preferMavenWrapper.toString();
    this.exhortMvnArgs = JSON.stringify(rhdaConfig.get('mvn.additionalArgs', [])) || '[]';
    this.exhortGradlePath = rhdaConfig.get('gradle.executable.path') || this.DEFAULT_GRADLE_EXECUTABLE;
    this.exhortPreferGradlew = preferGradleWrapper.toString();
    this.exhortNpmPath = rhdaConfig.get('npm.executable.path') || this.DEFAULT_NPM_EXECUTABLE;
    this.exhortPnpmPath = rhdaConfig.get('pnpm.executable.path') || this.DEFAULT_PNPM_EXECUTABLE;
    this.exhortYarnPath = rhdaConfig.get('yarn.executable.path') || this.DEFAULT_YARN_EXECUTABLE;
    this.exhortGoPath = rhdaConfig.get('go.executable.path') || this.DEFAULT_GO_EXECUTABLE;
    this.exhortPython3Path = rhdaConfig.get('python3.executable.path') || this.DEFAULT_PYTHON3_EXECUTABLE;
    this.exhortPip3Path = rhdaConfig.get('pip3.executable.path') || this.DEFAULT_PIP3_EXECUTABLE;
    this.exhortPythonPath = rhdaConfig.get('python.executable.path') || this.DEFAULT_PYTHON_EXECUTABLE;
    this.exhortPipPath = rhdaConfig.get('pip.executable.path') || this.DEFAULT_PIP_EXECUTABLE;
    this.exhortCargoPath = rhdaConfig.get('cargo.executable.path') || this.DEFAULT_CARGO_EXECUTABLE;
    this.exhortSyftPath = rhdaConfig.get('syft.executable.path') || this.DEFAULT_SYFT_EXECUTABLE;
    this.exhortSyftConfigPath = rhdaConfig.get('syft.config.path', '');
    this.exhortSkopeoPath = rhdaConfig.get('skopeo.executable.path') || this.DEFAULT_SKOPEO_EXECUTABLE;
    this.exhortSkopeoConfigPath = rhdaConfig.get('skopeo.config.path', '');
    this.exhortDockerPath = rhdaConfig.get('docker.executable.path') || this.DEFAULT_DOCKER_EXECUTABLE;
    this.exhortPodmanPath = rhdaConfig.get('podman.executable.path') || this.DEFAULT_PODMAN_EXECUTABLE;
    this.exhortImagePlatform = rhdaConfig.get('imagePlatform', '');
    this.excludePatterns = (rhdaConfig.get('exclude', []) as string[]).map(pattern => new Minimatch(pattern));
    this.oidcRealmUrl = rhdaConfig.get('oidc.endpoint', 'https://sso.redhat.com/auth/realms/redhat-external');
    this.oidcClientId = rhdaConfig.get('oidc.clientId', 'rhda-vscode');
    this.oidcAllowInsecure = rhdaConfig.get('oidc.allowInsecure', false);
    this.licenseCheckEnabled = rhdaConfig.get('licenseCheckEnabled', true);
  }

  private getEffectiveHttpProxyUrl(): string {
    const httpConfig = vscode.workspace.getConfiguration('http');

    const proxySupport = httpConfig.get<string>('proxySupport');
    if (proxySupport === 'off') {
      return '';
    }

    const proxyFromSettings = httpConfig.get<string>('proxy');
    if (proxyFromSettings && proxyFromSettings.trim() !== '') {
      return proxyFromSettings.trim();
    }

    const envProxy =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    if (envProxy && envProxy.trim() !== '') {
      return envProxy.trim();
    }

    return '';
  }

  /**
   * Sets process environment variables based on configuration settings.
   * @private
   */
  private async setProcessEnv(): Promise<void> {
    process.env['VSCEXT_STACK_ANALYSIS_COMMAND'] = this.stackAnalysisCommand;
    process.env['VSCEXT_TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND'] = this.trackRecommendationAcceptanceCommand;
    process.env['VSCEXT_UTM_SOURCE'] = this.utmSource;
    process.env['VSCEXT_PROXY_URL'] = this.exhortProxyUrl;
    process.env['VSCEXT_MATCH_MANIFEST_VERSIONS'] = this.matchManifestVersions;
    process.env['VSCEXT_USE_PYTHON_VIRTUAL_ENVIRONMENT'] = this.usePythonVirtualEnvironment;
    process.env['VSCEXT_USE_GO_MVS'] = this.useGoMVS;
    process.env['VSCEXT_ENABLE_PYTHON_BEST_EFFORTS_INSTALLATION'] = this.enablePythonBestEffortsInstallation;
    process.env['VSCEXT_USE_PIP_DEP_TREE'] = this.usePipDepTree;
    process.env['VSCEXT_VULNERABILITY_ALERT_SEVERITY'] = this.vulnerabilityAlertSeverity;
    process.env['VSCEXT_TRUSTIFY_DA_MVN_PATH'] = this.exhortMvnPath;
    process.env['VSCEXT_TRUSTIFY_DA_PREFER_MVNW'] = this.exhortPreferMvnw;
    process.env['VSCEXT_TRUSTIFY_DA_MVN_ARGS'] = this.exhortMvnArgs;
    process.env['VSCEXT_TRUSTIFY_DA_GRADLE_PATH'] = this.exhortGradlePath;
    process.env['VSCEXT_TRUSTIFY_DA_PREFER_GRADLEW'] = this.exhortPreferGradlew;
    process.env['VSCEXT_TRUSTIFY_DA_NPM_PATH'] = this.exhortNpmPath;
    process.env['VSCEXT_TRUSTIFY_DA_YARN_PATH'] = this.exhortYarnPath;
    process.env['VSCEXT_TRUSTIFY_DA_PNPM_PATH'] = this.exhortPnpmPath;
    process.env['VSCEXT_TRUSTIFY_DA_GO_PATH'] = this.exhortGoPath;
    process.env['VSCEXT_TRUSTIFY_DA_PYTHON3_PATH'] = this.exhortPython3Path;
    process.env['VSCEXT_TRUSTIFY_DA_PIP3_PATH'] = this.exhortPip3Path;
    process.env['VSCEXT_TRUSTIFY_DA_PYTHON_PATH'] = this.exhortPythonPath;
    process.env['VSCEXT_TRUSTIFY_DA_PIP_PATH'] = this.exhortPipPath;
    process.env['VSCEXT_TRUSTIFY_DA_CARGO_PATH'] = this.exhortCargoPath;
    process.env['VSCEXT_TELEMETRY_ID'] = this.telemetryId;
    process.env['VSCEXT_TRUSTIFY_DA_BACKEND_URL'] = this.backendUrl;
    process.env['VSCEXT_TRUSTIFY_DA_SYFT_PATH'] = this.exhortSyftPath;
    process.env['VSCEXT_TRUSTIFY_DA_SYFT_CONFIG_PATH'] = this.exhortSyftConfigPath;
    process.env['VSCEXT_TRUSTIFY_DA_SKOPEO_PATH'] = this.exhortSkopeoPath;
    process.env['VSCEXT_TRUSTIFY_DA_SKOPEO_CONFIG_PATH'] = this.exhortSkopeoConfigPath;
    process.env['VSCEXT_TRUSTIFY_DA_DOCKER_PATH'] = this.exhortDockerPath;
    process.env['VSCEXT_TRUSTIFY_DA_PODMAN_PATH'] = this.exhortPodmanPath;
    process.env['VSCEXT_TRUSTIFY_DA_IMAGE_PLATFORM'] = this.exhortImagePlatform;
  }

  /**
   * Authorizes the RHDA (Red Hat Dependency Analytics) service.
   * @param context The extension context for authorization.
   */
  async authorizeRHDA(context: vscode.ExtensionContext): Promise<void> {
    this.telemetryId = await getTelemetryId(context);
    await this.setProcessEnv();
  }

  /**
   * Links the secret storage to the configuration object.
   * @param context The extension context.
   */
  linkToSecretStorage(context: { secrets: vscode.SecretStorage }) {
    this.secrets = context.secrets;
  }
}

/**
 * The global configuration object for the extension.
 */
const globalConfig = new Config();

export { globalConfig };

