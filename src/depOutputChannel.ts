'use strict';

import * as vscode from 'vscode';
import { Titles } from './constants';

export class DepOutputChannel {
  outputChannel: vscode.OutputChannel;
  constructor(channelName: string = Titles.EXT_TITLE) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
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

  addMsgOutputChannel(msg: string): void {
    this.outputChannel.append(msg);
  }
}
