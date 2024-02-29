'use strict';

import { StatusBarItem, window, StatusBarAlignment, Uri } from 'vscode';
import { Disposable } from 'vscode-languageclient';
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
    public showSummary(text: string, uri: string): void {
        this.statusBarItem.text = text;
        this.statusBarItem.command = {
            title: PromptText.FULL_STACK_PROMPT_TEXT,
            command: commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND,
            arguments: [Uri.parse(uri)]
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
            title: PromptText.LSP_FAILURE_TEXT,
            command: commands.STACK_LOGS_COMMAND,
        };
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
