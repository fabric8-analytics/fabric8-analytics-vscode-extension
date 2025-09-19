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
   * Shows authentication required status in the status bar.
   */
  public showAuthRequired(): void {
    this.statusBarItem.text = `$(account) RHDA: Not Signed In`;
    this.statusBarItem.command = {
      title: 'Authenticate with RHDA',
      command: 'rhda.authenticate',
    };
    this.statusBarItem.tooltip = 'Click to sign in for enhanced RHDA features (optional)';
    this.statusBarItem.show();
  }

  /**
   * Shows authenticated status in the status bar.
   */
  public showAuthenticated(): void {
    this.statusBarItem.text = `$(verified) RHDA: Authenticated`;
    this.statusBarItem.command = undefined; // No command needed when authenticated
    this.statusBarItem.tooltip = 'RHDA is authenticated and ready for dependency analysis';
    this.statusBarItem.show();
  }

  /**
   * Shows session expired status in the status bar.
   */
  public showSessionExpired(): void {
    this.statusBarItem.text = `$(warning) RHDA: Session Expired`;
    this.statusBarItem.command = {
      title: 'Re-authenticate with RHDA',
      command: 'rhda.authenticate',
    };
    this.statusBarItem.tooltip = 'Your RHDA session has expired. Click to re-authenticate and restore functionality.';
    this.statusBarItem.show();
  }

  /**
   * Hides the status bar item.
   */
  public hide(): void {
    this.statusBarItem.hide();
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
