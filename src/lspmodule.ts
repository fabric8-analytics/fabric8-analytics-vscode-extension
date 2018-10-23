'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';
import { authextension } from './authextension';
import { StatusMessages } from './statusMessages';

export module lspmodule {

    export let invoke_f8_lsp: any;

    invoke_f8_lsp = (context: vscode.ExtensionContext, clb) : any => {
        // The server is implemented in node
        let serverModule = context.asAbsolutePath(path.join('node_modules/fabric8-analytics-lsp-server', 'server.js'));
        // The debug options for the server
        let debugOptions = { execArgv: ['--nolazy', '--debug=6009'] };

        authextension.authorize_f8_analytics(context, (data) => {
            if(data){
                // If the extension is launched in debug mode then the debug server options are used
                // Otherwise the run options are used

                let serverOptions: ServerOptions = {
                    run : { module: serverModule, transport: TransportKind.ipc },
                    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
                };
                // Options to control the language client
                let clientOptions: LanguageClientOptions = {
                    // Register the server for plain text documents 'plaintext','xml','json'
                    documentSelector: ['json','xml','xsd'],
                        synchronize: {
                            // Synchronize the setting section 'dependencyAnalyticsServer' to the server
                            configurationSection: 'dependencyAnalyticsServer',
                            // Notify the server about file changes to '.clientrc files contain in the workspace
                            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
                        }
                };

                // Create the language client and start the client.
                let disposableLSp = new LanguageClient('dependencyAnalyticsServer', 'Dependency Analytics Language Server', serverOptions, clientOptions);
                
                vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
                    p.report({message: StatusMessages.LSP_INITIALIZE });
                    return new Promise((resolve, reject) => {
                        disposableLSp.onReady().then(() => {
                            setTimeout(function () {
                                resolve();
                            }, 2000);
                            
                        }).catch((err) => {
                            reject();
                        });
                    });
                });

                clb(disposableLSp);
                //return disposableLSp;
            } 
        });
    };
}
