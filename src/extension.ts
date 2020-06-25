'use strict';

import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { GlobalState, extensionQualifiedId, registrationURL } from './constants';
import { DependencyReportPanel } from './dependencyReportPanel';
import { multimanifestmodule } from './multimanifestmodule';
import { authextension } from './authextension';
import { StatusMessages } from './statusMessages';
import { DepOutputChannel } from './DepOutputChannel';

let lspClient: LanguageClient;
let diagCountInfo,
  onFileOpen = [],
  caNotif = false;
export let outputChannelDep: any;

export function activate(context: vscode.ExtensionContext) {
  let disposableFullStack = vscode.commands.registerCommand(
    Commands.TRIGGER_FULL_STACK_ANALYSIS,
    (uri: vscode.Uri) => {
      // uri will be null in case user have use context menu/file explorer
      const fileUri = uri ? uri : vscode.window.activeTextEditor.document.uri;
      multimanifestmodule.dependencyAnalyticsReportFlow(context, fileUri);
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

  // show welcome message after first install or upgrade
  showUpdateNotification(context);

  authextension.authorize_f8_analytics(context).then(data => {
    if (data) {
      // Create output channel
      outputChannelDep = initOutputChannel();
      // The server is implemented in node
      let serverModule = context.asAbsolutePath(
        path.join('node_modules/fabric8-analytics-lsp-server', 'server.js')
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
          { scheme: 'file', language: 'pip-requirements' }
        ],
        synchronize: {
          // Synchronize the setting section 'dependencyAnalyticsServer' to the server
          configurationSection: 'dependencyAnalyticsServer',
          // Notify the server about file changes to '.clientrc files contained in the workspace
          fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
      };

      // Create the language client and start the client.
      lspClient = new LanguageClient(
        'dependencyAnalyticsServer',
        'Dependency Analytics Language Server',
        serverOptions,
        clientOptions
      );

      lspClient.onReady().then(() => {
        lspClient.onNotification('caNotification', respData => {
          if (
            respData &&
            respData.hasOwnProperty('diagCount') &&
            vscode.window.activeTextEditor &&
            ((respData.diagCount > 0 && respData.diagCount !== diagCountInfo) ||
              !onFileOpen ||
              (onFileOpen &&
                onFileOpen.indexOf(
                  vscode.window.activeTextEditor.document.fileName
                ) === -1))
          ) {
            diagCountInfo = respData.diagCount;
            onFileOpen.push(vscode.window.activeTextEditor.document.fileName);
            showInfoOnfileOpen(respData.data);
          }
          if (!caNotif) {
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Window,
                title: StatusMessages.EXT_TITLE
              },
              progress => {
                caNotif = true;
                progress.report({
                  message: 'Checking for security vulnerabilities ...'
                });

                setTimeout(() => {
                  progress.report({
                    message: respData.data
                  });
                }, 1000);

                let p = new Promise(resolve => {
                  setTimeout(() => {
                    caNotif = false;
                    resolve();
                  }, 1600);
                });
                return p;
              }
            );
          }
        });
      });
      context.subscriptions.push(
        lspClient.start(),
        disposableFullStack,
        disposableStackLogs
      );
    }
  });

  let showInfoOnfileOpen = (msg: string) => {
    vscode.window
      .showInformationMessage(`${msg}. Powered by [Snyk](${registrationURL})`, 'Dependency Analytics Report ...')
      .then((selection: any) => {
        if (selection === 'Dependency Analytics Report ...') {
          vscode.commands.executeCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS);
        }
      });
  };
}

export function initOutputChannel(): any {
  const outputChannelDepInit = new DepOutputChannel();
  return outputChannelDepInit;
}

export function deactivate(): Thenable<void> {
  if (!lspClient) {
    return undefined;
  }
  onFileOpen = [];
  return lspClient.stop();
}

async function showUpdateNotification(context: vscode.ExtensionContext) {
  // Retrive current and previous version string to show welcome message
  const packageJSON = vscode.extensions.getExtension(extensionQualifiedId).packageJSON;
  const version = packageJSON.version;
  const previousVersion = context.globalState.get<string>(GlobalState.Version);
  // Nothing to display
  if (version === previousVersion)
    return;

  // store current version into localStorage
  context.globalState.update(GlobalState.Version, version);

  const actions: vscode.MessageItem[] = [{ title: 'README' }, { title: 'Release Notes' }];

  const displayName = packageJSON.displayName;
  const result = await vscode.window.showInformationMessage(
    `${displayName} has been updated to v${version} — check out what's new!`,
    ...actions
  );

  if (result != null) {
    if (result === actions[0]) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(packageJSON.homepage));
    } else if (result === actions[1]) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${packageJSON.repository.url}/releases/tag/${version}`));
    }
  }
}
