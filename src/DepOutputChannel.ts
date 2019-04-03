'use strict';

import * as vscode from 'vscode';

export class DepOutputChannel {
  outputChannel: vscode.OutputChannel;
  constructor(channelName = 'Dependency Analytics') {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
  }

  getOutputChannel(): vscode.OutputChannel {
    this.outputChannel.clear();
    return this.outputChannel;
  }

  showOutputChannel(): void {
    this.outputChannel.show();
  }

  clearOutputChannel(): void {
    this.outputChannel.clear();
  }

  addMsgOutputChannel(msg: string) {
    this.outputChannel.append(msg);
  }
}
