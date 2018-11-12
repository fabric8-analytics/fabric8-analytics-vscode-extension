'use strict';

import * as vscode from 'vscode';
import { LanguageClient,
		LanguageClientOptions,
		ServerOptions,
		TransportKind } from 'vscode-languageclient';
import * as path from 'path';

import { Commands } from './commands';
import { contentprovidermodule } from './contentprovidermodule';
import { Multimanifestmodule } from './multimanifestmodule';
import { Authextension } from './authextension';
import { StatusMessages } from './statusMessages';

let lspClient: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

	let provider = new contentprovidermodule.TextDocumentContentProvider();  //new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('fabric8-analytics-widget', provider);
	
	let disposableFullStack = vscode.commands.registerCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS, () => Multimanifestmodule.dependencyAnalyticsReportFlow(context, provider, previewUri));
	
	let runCodeAction = ((document: vscode.TextDocument, range: vscode.Range, message:string) => {
		let edit = new vscode.WorkspaceEdit();
		let editor = vscode.window.activeTextEditor;
		edit.replace(editor.document.uri, document['range'], document['newText']);
		return vscode.workspace.applyEdit(edit);
	});
	let disposableLspEdit = vscode.commands.registerCommand(Commands.TRIGGER_LSP_EDIT, runCodeAction, this);  

	Authextension.authorize_f8_analytics(context, (data) => {
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
				documentSelector: [{ scheme: 'file', language: 'json' },{ scheme: 'file', language: 'xml' }],
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
				lspClient.onNotification('caNotification', (respData) => {
					vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
						return new Promise((resolve, reject) => {
							p.report({message: 'Checking for security vulnerabilities ...' });
							p.report({message: respData.data });
							setTimeout(function () {	
							  resolve();
							  if(respData && respData.hasOwnProperty('isEditAction') && !respData.isEditAction) {
								showInfoOnfileOpen(respData.data);
							  }
							}, 2500);
						});
					});
				});	
			});


			context.subscriptions.push(registration,lspClient.start(), disposableFullStack, disposableLspEdit);
		}
	});

	let showInfoOnfileOpen = ((msg: string) => {
		vscode.window.showInformationMessage(`${msg}.`, 'Dependency Analytics Report ...').then((selection:any) => {
			if(selection === 'Dependency Analytics Report ...'){
				vscode.commands.executeCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS);
			}
		});
	});
}

export function deactivate(): Thenable<void> {
	if (!lspClient) {
		return undefined;
	}
	return lspClient.stop();
}

