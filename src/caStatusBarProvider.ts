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
            title: StatusMessages.FULL_STACK_PROMPT_BUTTON,
            command: Commands.TRIGGER_FULL_STACK_ANALYSIS,
        };
        this.statusBarItem.tooltip = `Dependency Analytics, ${StatusMessages.FULL_STACK_PROMPT_BUTTON}`;
        this.statusBarItem.show();
    }

    public updateText(text: string): void {
        this.statusBarItem.text = text;
    }

    public setBusy(): void {
        this.statusBarItem.text = StatusIcon.Busy;
    }

    public setError(): void {
        this.statusBarItem.text = StatusIcon.Error;
    }

    public setReady(): void {
        this.statusBarItem.text = StatusIcon.Ready;
    }

    public updateTooltip(tooltip: string): void {
        this.statusBarItem.tooltip = tooltip;
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

enum StatusIcon {
    LightWeight = "$(rocket)",
    Busy = "$(sync~spin)",
    Ready = "$(thumbsup)",
    Error = "$(thumbsdown)"
}

export const caStatusBarProvider: CAStatusBarProvider = new CAStatusBarProvider();
