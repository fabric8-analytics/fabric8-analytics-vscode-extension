'use strict';

import * as path from 'path';
import * as vscode from 'vscode';

import * as commands from './commands';
import { GlobalState, EXTENSION_QUALIFIED_ID, REDHAT_MAVEN_REPOSITORY, REDHAT_MAVEN_REPOSITORY_DOCUMENTATION_URL, REDHAT_CATALOG } from './constants';
import { generateRHDAReport } from './rhda';
import { globalConfig } from './config';
import { StatusMessages, PromptText } from './constants';
import { caStatusBarProvider } from './caStatusBarProvider';
import { CANotification } from './caNotification';
import { DepOutputChannel } from './depOutputChannel';
import { record, startUp, TelemetryActions } from './redhatTelemetry';
import { applySettingNameMappings, buildErrorMessage } from './utils';
import { clearCodeActionsMap, getDiagnosticsCodeActions } from './codeActionHandler';
import { AnalysisMatcher } from './fileHandler';
import { EventEmitter } from 'node:events';

export let outputChannelDep: DepOutputChannel;

export const notifications = new EventEmitter();

/**
 * Activates the extension upon launch.
 * @param context - The extension context.
 */
export async function activate(context: vscode.ExtensionContext) {
  outputChannelDep = new DepOutputChannel();

  globalConfig.linkToSecretStorage(context);

  startUp(context);

  context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new class implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, ctx: vscode.CodeActionContext): vscode.ProviderResult<vscode.CodeAction[]> {
      return getDiagnosticsCodeActions(ctx.diagnostics, document.uri);
    }
  }()));

  const fileHandler = new AnalysisMatcher();
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => fileHandler.handle(doc)));
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => fileHandler.handle(doc)));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => clearCodeActionsMap(doc.uri)));
  // iterate all open docs, as theres no "did open doc" event for these
  // TODO: why is pom.xml not being picked up as background file
  for (const doc of vscode.workspace.textDocuments) {
    fileHandler.handle(doc);
  }

  // show welcome message after first install or upgrade
  showUpdateNotification(context);

  const disposableStackAnalysisCommand = vscode.commands.registerCommand(
    commands.STACK_ANALYSIS_COMMAND,
    // filePath must be string as this can be invoked from the editor
    async (filePath: string, isFromCA: boolean = false) => {
      const fspath = filePath ? filePath : vscode.window.activeTextEditor.document.uri.fsPath;
      const fileName = path.basename(fspath);
      if (isFromCA) {
        record(context, TelemetryActions.componentAnalysisVulnerabilityReportQuickfixOption, { manifest: fileName, fileName: fileName });
      }
      try {
        await generateRHDAReport(context, fspath, outputChannelDep);
        record(context, TelemetryActions.vulnerabilityReportDone, { manifest: fileName, fileName: fileName });
      } catch (error) {
        const message = applySettingNameMappings(error.message);
        vscode.window.showErrorMessage(message);
        outputChannelDep.error(buildErrorMessage(error));
        record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: fileName, fileName: fileName, error: message });
      }
    }
  );

  const disposableStackLogsCommand = vscode.commands.registerCommand(
    commands.STACK_LOGS_COMMAND,
    () => {
      if (outputChannelDep) {
        outputChannelDep.show();
      } else {
        vscode.window.showInformationMessage(StatusMessages.WIN_SHOW_LOGS);
      }
    }
  );

  const disposableTrackRecommendationAcceptance = vscode.commands.registerCommand(
    commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND,
    (dependency, fileName) => {
      record(context, TelemetryActions.componentAnalysisRecommendationAccepted, { manifest: fileName, fileName: fileName, package: dependency.split('@')[0], version: dependency.split('@')[1] });

      if (fileName === 'Dockerfile' || fileName === 'Containerfile') {
        redirectToRedHatCatalog();
      }
      if (fileName === 'pom.xml') {
        showRHRepositoryRecommendationNotification();
      }
    }
  );

  registerStackAnalysisCommands(context);

  const showVulnerabilityFoundPrompt = async (msg: string, filePath: vscode.Uri) => {
    const fileName = path.basename(filePath.fsPath);
    const selection = await vscode.window.showWarningMessage(`${msg}`, PromptText.FULL_STACK_PROMPT_TEXT);
    if (selection === PromptText.FULL_STACK_PROMPT_TEXT) {
      record(context, TelemetryActions.vulnerabilityReportPopupOpened, { manifest: fileName, fileName: fileName });
      // TODO: Uri not string path
      vscode.commands.executeCommand(commands.STACK_ANALYSIS_COMMAND, filePath.fsPath);
    } else {
      record(context, TelemetryActions.vulnerabilityReportPopupIgnored, { manifest: fileName, fileName: fileName });
    }
  };

  notifications.on('caNotification', respData => {
    const notification = new CANotification(respData);
    caStatusBarProvider.showSummary(notification.statusText(), notification.origin());
    if (notification.hasWarning()) {
      showVulnerabilityFoundPrompt(notification.popupText(), notification.origin());
      record(context, TelemetryActions.componentAnalysisDone, { manifest: path.basename(notification.origin().fsPath), fileName: path.basename(notification.origin().fsPath) });
    }
  });

  notifications.on('caError', errorData => {
    const notification = new CANotification(errorData);
    caStatusBarProvider.setError();

    // Since CA is an automated feature, only warning message will be shown on failure
    vscode.window.showWarningMessage(notification.errorMsg());

    // Record telemetry event
    record(context, TelemetryActions.componentAnalysisFailed, { manifest: path.basename(notification.origin().fsPath), fileName: path.basename(notification.origin().fsPath), error: notification.errorMsg() });
  });

  try {
    await globalConfig.authorizeRHDA(context);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to Authorize Red Hat Dependency Analytics extension: ${err.message}`);
    throw err;
  }

  context.subscriptions.push(
    disposableStackAnalysisCommand,
    disposableStackLogsCommand,
    disposableTrackRecommendationAcceptance,
    // disposableSetSnykToken,
    caStatusBarProvider,
  );

  vscode.workspace.onDidChangeConfiguration(() => {
    globalConfig.loadData();
  });
}

/**
 * Deactivates the extension.
 */
export function deactivate(): Thenable<void> { return; }

/**
 * Shows an update notification if the extension has been updated to a new version.
 * @param context - The extension context.
 * @returns A Promise that resolves once the notification has been displayed if needed.
 */
async function showUpdateNotification(context: vscode.ExtensionContext) {

  const packageJSON = vscode.extensions.getExtension(EXTENSION_QUALIFIED_ID).packageJSON;
  const version = packageJSON.version;
  const previousVersion = context.globalState.get<string>(GlobalState.VERSION);

  if (version === previousVersion) {
    return;
  }

  context.globalState.update(GlobalState.VERSION, version);

  const result = await vscode.window.showInformationMessage(
    `${packageJSON.displayName} has been updated to v${version} — check out what's new!`,
    'README',
    'Release Notes'
  );

  if (result !== undefined) {
    if (result === 'README') {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(packageJSON.homepage));
    } else if (result === 'Release Notes') {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${packageJSON.repository.url}/releases/tag/v${version}`));
    }
  }
}

/**
 * Redirects the user to the Red Hat certified image catalog website.
 */
function redirectToRedHatCatalog() {
  vscode.env.openExternal(vscode.Uri.parse(REDHAT_CATALOG));
}

/**
 * Shows a notification regarding Red Hat Dependency Analytics recommendations.
 */
function showRHRepositoryRecommendationNotification() {
  const msg = 'Important: If you apply Red Hat Dependency Analytics recommendations, ' +
    `make sure the Red Hat GA Repository (${REDHAT_MAVEN_REPOSITORY}) has been added to your project configuration. ` +
    'This ensures that the applied dependencies work correctly. ' +
    `Learn how to add the repository: [Click here](${REDHAT_MAVEN_REPOSITORY_DOCUMENTATION_URL})`;
  vscode.window.showWarningMessage(msg);
}

/**
 * Registers stack analysis commands to track RHDA report generations.
 * @param context - The extension context.
 */
function registerStackAnalysisCommands(context: vscode.ExtensionContext) {

  const invokeFullStackReport = async (filePath: string) => {
    const fileName = path.basename(filePath);
    try {
      await generateRHDAReport(context, filePath, outputChannelDep);
      record(context, TelemetryActions.vulnerabilityReportDone, { manifest: fileName, fileName: fileName });
    } catch (error) {
      const message = applySettingNameMappings(error.message);
      vscode.window.showErrorMessage(message);
      outputChannelDep.error(buildErrorMessage(error));
      record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: fileName, fileName: fileName, error: message });
    }
  };

  const recordAndInvoke = (origin: string, uri: vscode.Uri) => {
    const fileUri = uri || vscode.window.activeTextEditor.document.uri;
    const filePath = fileUri.fsPath;
    record(context, origin, { manifest: path.basename(filePath), fileName: path.basename(filePath) });
    invokeFullStackReport(filePath);
  };

  const registerCommand = (cmd: string, action: TelemetryActions) => {
    return vscode.commands.registerCommand(cmd, recordAndInvoke.bind(null, action));
  };

  const stackAnalysisCommands = [
    registerCommand(commands.STACK_ANALYSIS_FROM_EDITOR_COMMAND, TelemetryActions.vulnerabilityReportEditor),
    registerCommand(commands.STACK_ANALYSIS_FROM_EXPLORER_COMMAND, TelemetryActions.vulnerabilityReportExplorer),
    registerCommand(commands.STACK_ANALYSIS_FROM_PIE_BTN_COMMAND, TelemetryActions.vulnerabilityReportPieBtn),
    registerCommand(commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND, TelemetryActions.vulnerabilityReportStatusBar),
  ];

  context.subscriptions.push(...stackAnalysisCommands);
}