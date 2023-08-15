import * as vscode from 'vscode';

import { Templates } from './template';
import { Titles } from './constants';
import { Config } from './config';
import * as fs from 'fs';

const loaderTmpl = Templates.LOADER_TEMPLATE;
const errorTmpl = Templates.ERROR_TEMPLATE;

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
      Titles.REPORT_TITLE,
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
    if (data && /<\s*html[^>]*>/i.test(data)) {
      DependencyReportPanel.data = data;
      this._panel.webview.html = data;
    } else {
      this._panel.webview.html = errorTmpl;
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
    this._panel.title = Titles.REPORT_TITLE;
    let output = DependencyReportPanel.data;
    this._panel.webview.html = output && /<\s*html[^>]*>/i.test(output) ?
      output :
      loaderTmpl;
  }
}