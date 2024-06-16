import * as vscode from 'vscode';

import * as templates from './template';
import { Titles } from './constants';
import { globalConfig } from './config';
import * as fs from 'fs';

const loaderTmpl = templates.LOADER_TEMPLATE;
const errorTmpl = templates.ERROR_TEMPLATE;

/**
 * Manages the webview panel for RHDA reports.
 * Tracks the currently panel. Only allow a single panel to exist at a time.
 */
export class DependencyReportPanel {

  public static currentPanel: DependencyReportPanel | undefined;

  public static readonly viewType = 'stackReport';
  public static data;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  /**
   * Creates or shows the webview panel.
   */
  public static createOrShowWebviewPanel() {
    /* istanbul ignore next */
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    DependencyReportPanel.data = null;

    // If we already have a panel, show it.
    if (DependencyReportPanel.currentPanel) {
      if (DependencyReportPanel.currentPanel.getPanelVisibility()) {
        DependencyReportPanel.currentPanel._updateWebViewPanel();
      } else {
        DependencyReportPanel.currentPanel._revealWebviewPanel(column);
      }
      DependencyReportPanel.currentPanel._disposeReport();
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
    this._updateWebViewPanel();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(
      () => this.dispose(),
      null,
      this._disposables
    );

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this.getPanelVisibility()) {
          this._updateWebViewPanel();
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Updates the panel with the provided data.
   * @param data Data to update the panel with.
   */
  public doUpdatePanel(data: any) {
    if (data && /<\s*html[^>]*>/i.test(data)) {
      DependencyReportPanel.data = data;
      this._panel.webview.html = data;
    } else {
      DependencyReportPanel.data = errorTmpl;
      this._panel.webview.html = errorTmpl;
    }
  }

  /**
   * Disposes the panel.
   */
  public dispose() {
    DependencyReportPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();
    this._disposeReport();
    DependencyReportPanel.data = null;
    while (this._disposables.length) {
      const x = this._disposables.pop();
      /* istanbul ignore else */
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Checks if the panel is visible.
   * @returns A boolean indicating if the panel is visible.
   */
  public getPanelVisibility(): boolean {
    return this._panel.visible;
  }

  /**
   * Retrieves the HTML content of the webview panel.
   * @returns The HTML content of the webview panel.
   */
  public getWebviewPanelHtml(): string {
    return this._panel.webview.html;
  }

  /**
   * Reveals the webview panel.
   * @param column The column to reveal the panel in.
   * @private
   */
  private _revealWebviewPanel(column: vscode.ViewColumn) {
    this._panel.reveal(column);
  }

  /**
   * Updates the webview panel content.
   * @private
   */
  private _updateWebViewPanel() {
    const output = DependencyReportPanel.data;
    if (output && /<\s*html[^>]*>/i.test(output)) {
      this._panel.webview.html = output;
    } else {
      this._panel.webview.html = loaderTmpl;
    }
  }

  /**
   * Disposes the RHDA report file from local directory.
   * @private
   */
  private _disposeReport() {
    const reportFilePath = globalConfig.rhdaReportFilePath;
    if (fs.existsSync(reportFilePath)) {
      // Delete temp stackAnalysisReport file
      fs.unlinkSync(reportFilePath);
      console.log(`File ${reportFilePath} has been deleted.`);
    }
  }
}