'use strict';

import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';
import * as path from 'path';

import * as commands from './commands';
import { GlobalState, extensionQualifiedId } from './constants';
import { generateRHDAReport } from './stackAnalysis';
import { globalConfig } from './config';
import { StatusMessages, PromptText } from './constants';
import { caStatusBarProvider } from './caStatusBarProvider';
import { CANotification } from './caNotification';
import { DepOutputChannel } from './depOutputChannel';
import { record, startUp, TelemetryActions } from './redhatTelemetry';
import { validateSnykToken, validateOSSIndexToken } from './tokenValidation';

let lspClient: LanguageClient;

export let outputChannelDep: DepOutputChannel;

export function activate(context: vscode.ExtensionContext) {
  startUp(context);

  // show welcome message after first install or upgrade
  showUpdateNotification(context);

  const disposableStackAnalysisCommand = vscode.commands.registerCommand(
    commands.TRIGGER_FULL_STACK_ANALYSIS,
    async (uri: vscode.Uri) => {
      // uri will be null in case the user has used the context menu/file explorer
      const fileUri = uri ? uri : vscode.window.activeTextEditor.document.uri;
      try {
        await generateRHDAReport(context, fileUri);
        record(context, TelemetryActions.vulnerabilityReportDone, { manifest: path.basename(fileUri.fsPath), fileName: path.basename(fileUri.fsPath) });
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
        record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: path.basename(fileUri.fsPath), fileName: path.basename(fileUri.fsPath), error: error.message });
      }
    }
  );

  const disposableStackLogsCommand = vscode.commands.registerCommand(
    commands.TRIGGER_STACK_LOGS,
    () => {
      if (outputChannelDep) {
        outputChannelDep.showOutputChannel();
      } else {
        vscode.window.showInformationMessage(StatusMessages.WIN_SHOW_LOGS);
      }
    }
  );

  registerStackAnalysisCommands(context);

  globalConfig.authorizeRHDA(context)
    .then(() => {
      // Create output channel
      outputChannelDep = new DepOutputChannel();
      // The server is implemented in node
      const serverModule = context.asAbsolutePath(
        path.join('dist', 'server.js')
      );
      // The debug options for the server
      // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
      const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

      // If the extension is launched in debug mode then the debug server options are used
      // Otherwise the run options are used
      const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
          module: serverModule,
          transport: TransportKind.ipc,
          options: debugOptions
        }
      };

      // Options to control the language client
      const clientOptions: LanguageClientOptions = {
        // Register the server for xml, json documents
        documentSelector: [
          { scheme: 'file', language: 'json' },
          { scheme: 'file', language: 'xml' },
          { scheme: 'file', language: 'plaintext' },
          { scheme: 'file', language: 'pip-requirements' },
          { scheme: 'file', language: 'go' },
          { scheme: 'file', language: 'go.mod' }
        ],
        synchronize: {
          // Synchronize the setting section 'redHatDependencyAnalyticsServer' to the server
          configurationSection: 'redHatDependencyAnalyticsServer',
          // Notify the server about file changes to '.clientrc files contained in the workspace
          fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        }
      };

      // Create the language client and start the client.
      lspClient = new LanguageClient(
        'redHatDependencyAnalyticsServer',
        'Red Hat Dependency Analytics Language Server',
        serverOptions,
        clientOptions
      );
      lspClient.start().then(() => {

        const showVulnerabilityFoundPrompt = async (msg: string, fileName: string) => {
          const selection = await vscode.window.showWarningMessage(`${msg}`, PromptText.FULL_STACK_PROMPT_TEXT);
          if (selection === PromptText.FULL_STACK_PROMPT_TEXT) {
            vscode.commands.executeCommand(commands.TRIGGER_FULL_STACK_ANALYSIS);
            record(context, TelemetryActions.vulnerabilityReportPopupOpened, { manifest: fileName, fileName: fileName });
          }
          else {
            record(context, TelemetryActions.vulnerabilityReportPopupIgnored, { manifest: fileName, fileName: fileName });
          }
        };

        lspClient.onNotification('caNotification', respData => {
          const notification = new CANotification(respData);
          caStatusBarProvider.showSummary(notification.statusText(), notification.origin());
          if (notification.hasWarning()) {
            showVulnerabilityFoundPrompt(notification.popupText(), path.basename(notification.origin()));
            record(context, TelemetryActions.componentAnalysisDone, { manifest: path.basename(notification.origin()), fileName: path.basename(notification.origin()) });
          }
        });

        lspClient.onNotification('caError', errorData => {
          const notification = new CANotification(errorData);
          caStatusBarProvider.setError();

          // Since CA is an automated feature, only warning message will be shown on failure
          vscode.window.showWarningMessage(notification.errorMsg());

          // Record telemetry event
          record(context, TelemetryActions.componentAnalysisFailed, { manifest: path.basename(notification.origin()), fileName: path.basename(notification.origin()), error: notification.errorMsg() });
        });
      });
      context.subscriptions.push(
        disposableStackAnalysisCommand,
        disposableStackLogsCommand,
        caStatusBarProvider,
      );
    })
    .catch(error => {
      vscode.window.showErrorMessage(`Failed to Authorize Red Hat Dependency Analytics extension: ${error.message}`);
      throw (error);
    });

  vscode.workspace.onDidChangeConfiguration((event) => {

    globalConfig.loadData();

    if (event.affectsConfiguration('redHatDependencyAnalytics.exhortSnykToken')) {
      validateSnykToken();
    }
    if (event.affectsConfiguration('redHatDependencyAnalytics.exhortOSSIndexUser') || event.affectsConfiguration('redHatDependencyAnalytics.exhortOSSIndexToken')) {
      validateOSSIndexToken();
    }
  });
}

export function deactivate(): Thenable<void> {
  if (!lspClient) {
    return undefined;
  }
  return lspClient.stop();
}

async function showUpdateNotification(context: vscode.ExtensionContext) {

  const packageJSON = vscode.extensions.getExtension(extensionQualifiedId).packageJSON;
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

function registerStackAnalysisCommands(context: vscode.ExtensionContext) {

  const invokeFullStackReport = async (uri: vscode.Uri) => {
    try {
      await generateRHDAReport(context, uri);
      record(context, TelemetryActions.vulnerabilityReportDone, { manifest: path.basename(uri.fsPath), fileName: path.basename(uri.fsPath) });
    } catch (error) {
      vscode.window.showErrorMessage(error.message);
      record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: path.basename(uri.fsPath), fileName: path.basename(uri.fsPath), error: error.message });
    }
  };

  const recordAndInvoke = (origin: string, uri: vscode.Uri) => {
    const fileUri = uri || vscode.window.activeTextEditor.document.uri;
    record(context, origin, { manifest: fileUri.fsPath.split('/').pop(), fileName: fileUri.fsPath.split('/').pop() });
    invokeFullStackReport(fileUri);
  };

  const registerCommand = (cmd: string, action: TelemetryActions) => {
    return vscode.commands.registerCommand(cmd, recordAndInvoke.bind(null, action));
  };

  const stackAnalysisCommands = [
    registerCommand(commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR, TelemetryActions.vulnerabilityReportEditor),
    registerCommand(commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER, TelemetryActions.vulnerabilityReportExplorer),
    registerCommand(commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN, TelemetryActions.vulnerabilityReportPieBtn),
    registerCommand(commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR, TelemetryActions.vulnerabilityReportStatusBar),
  ];

  context.subscriptions.push(...stackAnalysisCommands);
}