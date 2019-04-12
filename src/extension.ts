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
import { multimanifestmodule } from './multimanifestmodule';
import { authextension } from './authextension';
import { StatusMessages } from './statusMessages';
import { DepOutputChannel } from './DepOutputChannel';

let lspClient: LanguageClient;
let diagCountInfo,
  onFileOpen = [];
export let outputChannelDep: any;

export function activate(context: vscode.ExtensionContext) {
  let disposableFullStack = vscode.commands.registerCommand(
    Commands.TRIGGER_FULL_STACK_ANALYSIS,
    (uri: vscode.Uri) =>
      multimanifestmodule.dependencyAnalyticsReportFlow(context, uri)
  );

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
          { scheme: 'file', language: 'xml' }
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
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Window,
              title: StatusMessages.EXT_TITLE
            },
            p => {
              return new Promise((resolve, reject) => {
                p.report({ message: respData.data });
                if (
                  respData &&
                  respData.hasOwnProperty('diagCount') &&
                  vscode.window.activeTextEditor &&
                  ((respData.diagCount > 0 &&
                    respData.diagCount !== diagCountInfo) ||
                    !onFileOpen ||
                    (onFileOpen &&
                      onFileOpen.indexOf(
                        vscode.window.activeTextEditor.document.fileName
                      ) === -1))
                ) {
                  setTimeout(() => {
                    resolve();
                  }, 1500);
                  diagCountInfo = respData.diagCount;
                  onFileOpen.push(
                    vscode.window.activeTextEditor.document.fileName
                  );
                  showInfoOnfileOpen(respData.data);
                } else if (
                  respData &&
                  respData.hasOwnProperty('diagCount') &&
                  respData.diagCount > 0
                ) {
                  setTimeout(() => {
                    resolve();
                  }, 1500);
                } else {
                  setTimeout(() => {
                    reject();
                  }, 2500);
                }
              });
            }
          );
        });
      });
      context.subscriptions.push(lspClient.start(), disposableFullStack);
    }
  });

  let showInfoOnfileOpen = (msg: string) => {
    vscode.window
      .showInformationMessage(`${msg}.`, 'Dependency Analytics Report ...')
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
