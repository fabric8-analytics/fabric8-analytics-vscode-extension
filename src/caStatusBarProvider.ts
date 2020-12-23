'use strict';

import { StatusBarItem, window, StatusBarAlignment } from "vscode";
import { Disposable } from "vscode-languageclient";
import { StatusMessages } from "./statusMessages";
import { Commands } from "./commands";

class CAStatusBarProvider implements Disposable {
    private statusBarItem: StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0);
    }

    public showSummary(text: string): void {
        this.statusBarItem.text = text;
        this.statusBarItem.command = {
            title: StatusMessages.FULL_STACK_PROMPT_TEXT,
            command: Commands.TRIGGER_FULL_STACK_ANALYSIS,
        };
        this.statusBarItem.tooltip = StatusMessages.FULL_STACK_PROMPT_TEXT;
        this.statusBarItem.show();
    }

    public setError(): void {
        this.statusBarItem.text = `$(error) Dependency analysis has failed`;
        this.statusBarItem.command = {
            title: StatusMessages.LSP_FAILURE_TEXT,
            command: Commands.TRIGGER_STACK_LOGS,
        };
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

export const caStatusBarProvider: CAStatusBarProvider = new CAStatusBarProvider();
