'use strict';

import * as vscode from 'vscode';
import { LanguageClient,
		LanguageClientOptions,
		ServerOptions,
		TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { contentprovidermodule } from './contentprovidermodule';
import { stackanalysismodule } from './stackanalysismodule';
import { multimanifestmodule } from './multimanifestmodule';
import { authextension } from './authextension';
import { StatusMessages } from './statusMessages';

let lspClient: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
  let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);

	let disposable = vscode.commands.registerCommand(Commands.TRIGGER_STACK_ANALYSIS, () => stackanalysismodule.triggerStackAnalyses(context, provider, previewUri));
  let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => multimanifestmodule.triggerFullStackAnalyses(context, provider, previewUri));

	authextension.authorize_f8_analytics(context, (data) => {
		if(data){
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
				documentSelector: ['json','xml','xsd'],
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
				lspClient.onNotification('caNotification', (data) => {
					vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
						return new Promise((resolve, reject) => {
							p.report({message: 'Analyzing dependencies for any security vulnerability' });
							p.report({message: data });
							setTimeout(function () {	
							  resolve();
							}, 2000);
						});
					});
				});	
			});
			context.subscriptions.push(disposable, registration,lspClient.start(), disposableFullStack);
		}
	});

}

export function deactivate(): Thenable<void> {
	if (!lspClient) {
		return undefined;
	}
	return lspClient.stop();
}

