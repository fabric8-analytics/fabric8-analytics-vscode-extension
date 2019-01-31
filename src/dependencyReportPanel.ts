import * as path from 'path';
import * as vscode from 'vscode';

import { Templates } from './template';
import { Apiendpoint } from './apiendpoint';

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
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private _loading = true;

  public static createOrShow(extensionPath: string, data: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    let loading = true;
    DependencyReportPanel.data = data;
    // if data is defined
    if (data) {
      // DependencyReportPanel.data = data;
      loading = false;
    }
    // If we already have a panel, show it.
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      DependencyReportPanel.viewType,
      'Test Analytics Report',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restric the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
      }
    );

    DependencyReportPanel.currentPanel = new DependencyReportPanel(
      panel,
      extensionPath,
      loading
    );
  }

  // public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
  //   DependencyReportPanel.currentPanel = new DependencyReportPanel(
  //     panel,
  //     extensionPath
  //   );
  // }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string,
    loading: boolean
  ) {
    this._panel = panel;
    this._extensionPath = extensionPath;

    // Set the webview's initial html content
    // this._update();
    this._loading = loading;
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
        }
      },
      null,
      this._disposables
    );
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: 'refactor' });
  }

  public doUpdatePanel(data) {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    // this._panel.webview.postMessage(data);
    if (data && data.request_id) {
      DependencyReportPanel.data = data;
      let r = header;
      let token_uri = undefined;
      portal_uri = `${Apiendpoint.STACK_REPORT_URL}#/analyze/${
        data.request_id
      }?interframe=true&api_data={"access_token":"${token_uri}","route_config":{"api_url":"${
        Apiendpoint.OSIO_ROUTE_URL
      }"},"user_key":"${Apiendpoint.STACK_API_USER_KEY}"}`;
      r += render_stack_iframe(portal_uri);
      r += footer;
      this._panel.webview.html = r;
    }
  }

  public dispose() {
    DependencyReportPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();
    this._loading = true;
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
    if (output && output.request_id) {
      let r = header;
      let token_uri = undefined;
      portal_uri = `${Apiendpoint.STACK_REPORT_URL}#/analyze/${
        output.request_id
      }?interframe=true&api_data={"access_token":"${token_uri}","route_config":{"api_url":"${
        Apiendpoint.OSIO_ROUTE_URL
      }"},"user_key":"${Apiendpoint.STACK_API_USER_KEY}"}`;
      r += render_stack_iframe(portal_uri);
      r += footer;
      return r;
    } else {
      return loader;
    }
  }
}

let render_project_failure = () => {
  return `<div>
                <p style='color:#ffffff;text-align: center;'>Unable to analyze your stack.</p>
              </div>`;
};

let render_stack_iframe = portaluri => {
  //const result = sa.result[0];
  return `<iframe width="100%" height="100%" frameborder="0" src=${portaluri} id="frame2" name="frame2"></iframe>`;
};
