'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';
import { authextension } from './authextension';

export module lspmodule {

    export let invoke_f8_lsp: any;

    invoke_f8_lsp = (context: vscode.ExtensionContext, clb) : any => {
    // The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('node_modules/component-analysis-lsp-server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

    authextension.authorize_f8_analytics(context, (data) => {
      if(data){
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used

        let serverOptions: ServerOptions = {
            run : { module: serverModule, transport: TransportKind.ipc },
            debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
        }
        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents 'plaintext','xml','json'
            documentSelector: ['*','xml','xsd'],
                synchronize: {
                    // Synchronize the setting section 'componentAnalysisServer' to the server
                    configurationSection: 'componentAnalysisServer',
                    // Notify the server about file changes to '.clientrc files contain in the workspace
                    fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
                }
        }

        // Create the language client and start the client.
        let disposableLSp = new LanguageClient('componentAnalysisServer', 'Component Analysis Language Server', serverOptions, clientOptions).start();
        clb(disposableLSp);
        //return disposableLSp;

      } 

    });

    }

}
