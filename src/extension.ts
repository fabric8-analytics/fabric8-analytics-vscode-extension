'use strict';

import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

import * as path from 'path';

import { Commands } from './commands';
import { GlobalState, extensionQualifiedId, registrationURL, redhatMavenRepository, redhatMavenRepositoryDocumentationURL } from './constants';
import { multimanifestmodule } from './multimanifestmodule';
import { authextension } from './authextension';
import { StatusMessages, PromptText } from './constants';
import { caStatusBarProvider } from './caStatusBarProvider';
import { CANotification } from './caNotification';
import { DepOutputChannel } from './DepOutputChannel';
import { record, startUp, TelemetryActions } from './redhatTelemetry';

let lspClient: LanguageClient;

export let outputChannelDep: any;

export function activate(context: vscode.ExtensionContext) {
  startUp(context);
  let disposableFullStack = vscode.commands.registerCommand(
    Commands.TRIGGER_FULL_STACK_ANALYSIS,
    (uri: vscode.Uri) => {
      try {
        // uri will be null in case the user has used the context menu/file explorer
        const fileUri = uri ? uri : vscode.window.activeTextEditor.document.uri;
        multimanifestmodule.dependencyAnalyticsReportFlow(context, fileUri);
      } catch (error) {
        // Throw a custom error message when the command execution fails
        throw new Error(`Running the contributed command: '${Commands.TRIGGER_FULL_STACK_ANALYSIS}' failed.`);
      }
    }
  );

  let rhRepositoryRecommendationNotification = vscode.commands.registerCommand(
    Commands.TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION,
    () => {
      const msg = `Important: If you apply dependency analysis recommendations, 
                    make sure the Red Hat GA Repository (${redhatMavenRepository}) has been added to your project configuration. 
                    This ensures that the applied dependencies work correctly. 
                    Learn how to add the repository: [Click here](${redhatMavenRepositoryDocumentationURL})`;
      vscode.window.showWarningMessage(msg);
    }
  );

  let disposableStackLogs = vscode.commands.registerCommand(
    Commands.TRIGGER_STACK_LOGS,
    () => {
      if (outputChannelDep) {
        outputChannelDep.showOutputChannel();
      } else {
        vscode.window.showInformationMessage(StatusMessages.WIN_SHOW_LOGS);
      }
    }
  );

  registerStackAnalysisCommands(context);

  // show welcome message after first install or upgrade
  showUpdateNotification(context);

  authextension.authorize_f8_analytics(context).then(data => {
    if (data) {
      // Create output channel
      outputChannelDep = initOutputChannel();
      // The server is implemented in node
      let serverModule = context.asAbsolutePath(
        path.join('dist', 'server.js')
      );
      // The debug options for the server
      // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
      let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

      // If the extension is launched in debug mode then the debug server options are used
      // Otherwise the run options are used
      let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
          module: serverModule,
          transport: TransportKind.ipc,
          options: debugOptions
        }
      };

      // Options to control the language client
      let clientOptions: LanguageClientOptions = {
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
          // Synchronize the setting section 'dependencyAnalyticsServer' to the server
          configurationSection: 'dependencyAnalyticsServer',
          // Notify the server about file changes to '.clientrc files contained in the workspace
          fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        },
        initializationOptions: {
          triggerFullStackAnalysis: Commands.TRIGGER_FULL_STACK_ANALYSIS,
          triggerRHRepositoryRecommendationNotification: Commands.TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION
        },
      };

      // Create the language client and start the client.
      lspClient = new LanguageClient(
        'dependencyAnalyticsServer',
        'Dependency Analytics Language Server',
        serverOptions,
        clientOptions
      );
      lspClient.start().then(() => {
        const notifiedFiles = new Set<string>();
        const canShowPopup = (notification: CANotification): boolean => {
          const hasAlreadyShown = notifiedFiles.has(notification.origin());
          return notification.hasWarning() && !hasAlreadyShown;
        };

        const showVulnerabilityFoundPrompt = async (msg: string, fileName: string) => {
          const selection = await vscode.window.showWarningMessage(`${msg}. Powered by [Snyk](${registrationURL})`, PromptText.FULL_STACK_PROMPT_TEXT);
          if (selection === PromptText.FULL_STACK_PROMPT_TEXT) {
            vscode.commands.executeCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS);
            record(context, TelemetryActions.vulnerabilityReportPopupOpened, { manifest: fileName, fileName: fileName });
          }
          else {
            record(context, TelemetryActions.vulnerabilityReportPopupIgnored, { manifest: fileName, fileName: fileName });
          }
        };

        lspClient.onNotification('caNotification', respData => {
          const notification = new CANotification(respData);
          caStatusBarProvider.showSummary(notification.statusText(), notification.origin());
          if (canShowPopup(notification)) {
            showVulnerabilityFoundPrompt(notification.popupText(), path.basename(notification.origin()));
            record(context, TelemetryActions.componentAnalysisDone, { manifest: path.basename(notification.origin()), fileName: path.basename(notification.origin()) });
            // prevent further popups.
            notifiedFiles.add(notification.origin());
          }
        });

        lspClient.onNotification('caError', respData => {
          const notification = new CANotification(respData);
          caStatusBarProvider.setError();
          vscode.window.showErrorMessage(respData.data);
          record(context, TelemetryActions.componentAnalysisFailed, { manifest: path.basename(notification.origin()), fileName: path.basename(notification.origin()), error: respData.data });
        });

        lspClient.onNotification('caSimpleWarning', msg => {
          vscode.window.showWarningMessage(msg);
        });
      });
      context.subscriptions.push(
        rhRepositoryRecommendationNotification,
        disposableFullStack,
        disposableStackLogs,
        caStatusBarProvider,
      );
    }
  });

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('dependencyAnalytics.exhortSnykToken')) {
      multimanifestmodule.triggerTokenValidation('snyk');
    }
    // add more token providers here...
  });
}

export function initOutputChannel(): any {
  const outputChannelDepInit = new DepOutputChannel();
  return outputChannelDepInit;
}

export function deactivate(): Thenable<void> {
  if (!lspClient) {
    return undefined;
  }
  return lspClient.stop();
}

async function showUpdateNotification(context: vscode.ExtensionContext) {
  // Retrive current and previous version string to show welcome message
  const packageJSON = vscode.extensions.getExtension(extensionQualifiedId).packageJSON;
  const version = packageJSON.version;
  const previousVersion = context.globalState.get<string>(GlobalState.Version);
  // Nothing to display
  if (version === previousVersion) {
    return;
  }

  // store current version into localStorage
  context.globalState.update(GlobalState.Version, version);

  const actions: vscode.MessageItem[] = [{ title: 'README' }, { title: 'Release Notes' }];

  const displayName = packageJSON.displayName;
  const result = await vscode.window.showInformationMessage(
    `${displayName} has been updated to v${version} — check out what's new!`,
    ...actions
  );

  if (result !== null) {
    if (result === actions[0]) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(packageJSON.homepage));
    } else if (result === actions[1]) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${packageJSON.repository.url}/releases/tag/${version}`));
    }
  }
}

function registerStackAnalysisCommands(context: vscode.ExtensionContext) {
  const invokeFullStackReport = (uri: vscode.Uri) => {
    const fileUri = uri || vscode.window.activeTextEditor.document.uri;
    multimanifestmodule.dependencyAnalyticsReportFlow(context, fileUri);
  };

  const recordAndInvoke = (origin: string, uri: vscode.Uri) => {
    record(context, origin, { manifest: uri.fsPath.split('/').pop(), fileName: uri.fsPath.split('/').pop() });
    invokeFullStackReport(uri);
  };

  const registerCommand = (cmd: string, action: TelemetryActions) => {
    return vscode.commands.registerCommand(cmd, recordAndInvoke.bind(null, action));
  };

  const stackAnalysisCommands = [
    registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR, TelemetryActions.vulnerabilityReportEditor),
    registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER, TelemetryActions.vulnerabilityReportExplorer),
    registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN, TelemetryActions.vulnerabilityReportPieBtn),
    registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR, TelemetryActions.vulnerabilityReportStatusBar),
  ];

  context.subscriptions.push(...stackAnalysisCommands);
}
