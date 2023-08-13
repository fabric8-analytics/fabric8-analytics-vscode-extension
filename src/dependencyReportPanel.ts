import * as path from 'path';
import * as vscode from 'vscode';

import { Templates } from './template';
import { Config } from './config';
import * as fs from 'fs';

const loader = Templates.LOADER_TEMPLATE;
const header = Templates.HEADER_TEMPLATE;
const footer = Templates.FOOTER_TEMPLATE;
let portal_uri: string = '';

/**
 * Manages cat coding webview panels
 */
export class DependencyReportPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: DependencyReportPanel | undefined;

  public static readonly viewType = 'stackReport';
  public static data;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionPath: string, data: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    DependencyReportPanel.data = data;
    // If we already have a panel, show it.
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      DependencyReportPanel.viewType,
      'Dependency Analytics Report',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,

        // And restric the webview to only loading content from our extension's `media` directory.
        localResourceRoots: []
      }
    );

    DependencyReportPanel.currentPanel = new DependencyReportPanel(panel);
  }

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;

    // Set the webview's initial html content
    // this._update();
    this._updateWebView();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          // this._update();
          this._updateWebView();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;

          case 'launch-link-in-external-browser':
            vscode.env.openExternal(message.url);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public doUpdatePanel(data: any) {
    if (data && data.external_request_id) {
      const apiConfig = Config.getApiConfig();
      DependencyReportPanel.data = data;
      let r = header;
      let token_uri = undefined;
      portal_uri = `${apiConfig.stackReportUIHost}#/analyze/${data.external_request_id
        }?interframe=true&api_data={"access_token":"${token_uri}","route_config":{"api_url":"${apiConfig.host
        }","ver":"v3","uuid":"${process.env.UUID}"},"user_key":"${apiConfig.apiKey}"}`;
      console.log('portal_uri', portal_uri);
      r += render_stack_iframe(portal_uri);
      r += footer;
      this._panel.webview.html = r;
    } else if (data && /<\s*html[^>]*>/i.test(data)) {
      DependencyReportPanel.data = data;
      this._panel.webview.html = data;
    } else if (!data || data === 'error') {
      let r = header;
      r += render_project_failure();
      r += footer;
      this._panel.webview.html = r;
    }
  }

  public dispose() {
    DependencyReportPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();
    const apiConfig = Config.getApiConfig();
    if (fs.existsSync(apiConfig.dependencyAnalysisReportFilePath)) {
      // Delete temp stackAnalysisReport file
      fs.unlinkSync(apiConfig.dependencyAnalysisReportFilePath);
      console.log(`File ${apiConfig.dependencyAnalysisReportFilePath} has been deleted.`);
    }
    DependencyReportPanel.data = null;
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _updateWebView() {
    this._panel.title = 'Dependency Analytics Report';
    this._panel.webview.html = this._renderHtmlForWebView();
  }

  private _renderHtmlForWebView() {
    let output = DependencyReportPanel.data;
    if (output && output.external_request_id) {
      const apiConfig = Config.getApiConfig();
      let r = header;
      let token_uri = undefined;
      portal_uri = `${apiConfig.stackReportUIHost}#/analyze/${output.external_request_id
        }?interframe=true&api_data={"access_token":"${token_uri}","route_config":{"api_url":"${apiConfig.host
        }","ver":"v3","uuid":"${process.env.UUID}"},"user_key":"${apiConfig.apiKey}"}`;
      r += render_stack_iframe(portal_uri);
      r += footer;
      return r;
    } else if (output && /<\s*html[^>]*>/i.test(output)) {
      return output;
    } else {
      return loader;
    }
  }
}

let render_project_failure = () => {
  return `<div>
                <p style='color:#000000;text-align: center;'>Unable to analyze your stack.</p>
              </div>`;
};

let render_stack_iframe = portaluri => {
  //const result = sa.result[0];
  return `<iframe id="frame" width="100%" height="100%" frameborder="0" src=${portaluri}></iframe>
  
  <script>

  const vscode = acquireVsCodeApi();
  window.addEventListener('message', (e) => {
    vscode.postMessage({
      command: 'launch-link-in-external-browser',
      url: e.data
    });  

  }, false);

  </script>

  `;
};
