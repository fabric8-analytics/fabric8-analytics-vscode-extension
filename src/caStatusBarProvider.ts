'use strict';

import { StatusBarItem, window, StatusBarAlignment, Uri, Disposable } from 'vscode';
import { PromptText } from './constants';
import * as commands from './commands';

/**
 * Provides status bar functionality for the extension.
 */
class CAStatusBarProvider implements Disposable {
  private statusBarItem: StatusBarItem;

  /**
   * Creates an instance of the CAStatusBarProvider class.
   */
  constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0);
  }

  /**
   * Displays summary information in the status bar.
   * @param text The text to display in the status bar.
   * @param uri The URI associated with the summary.
   */
  public showSummary(text: string, uri: Uri): void {
    this.statusBarItem.text = text;
    this.statusBarItem.command = {
      // Unused but required?
      title: PromptText.FULL_STACK_PROMPT_TEXT,
      command: commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND,
      arguments: [uri],
    };
    this.statusBarItem.tooltip = PromptText.FULL_STACK_PROMPT_TEXT;
    this.statusBarItem.show();
  }

  /**
   * Sets an error message in the status bar indicating a failed RHDA analysis.
   */
  public setError(): void {
    this.statusBarItem.text = `$(error) RHDA analysis has failed`;
    this.statusBarItem.command = {
      // Unused but required?
      title: PromptText.LSP_FAILURE_TEXT,
      command: commands.STACK_LOGS_COMMAND,
    };
    this.statusBarItem.tooltip = PromptText.LSP_FAILURE_TEXT;
  }

  /**
   * Disposes of the status bar item.
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

/**
 * Provides an instance of CAStatusBarProvider for use across the extension.
 */
export const caStatusBarProvider: CAStatusBarProvider = new CAStatusBarProvider();
