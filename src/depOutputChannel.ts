'use strict';

import * as vscode from 'vscode';
import { Titles } from './constants';

/**
 * Class representing an output channel for displaying messages in VS Code.
 */
export class DepOutputChannel {
  outputChannel: vscode.OutputChannel;

  /**
   * Creates an instance of DepOutputChannel.
   * @param channelName The name of the output channel. Defaults to the extension title.
   */
  constructor(channelName: string = Titles.EXT_TITLE) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  /**
   * Retrieves the VS Code OutputChannel instance.
   * Clears the channel before returning.
   * @returns The VS Code OutputChannel instance.
   */
  getOutputChannel(): vscode.OutputChannel {
    this.outputChannel.clear();
    return this.outputChannel;
  }

  /**
   * Shows the output channel in the VS Code UI.
   */
  showOutputChannel(): void {
    this.outputChannel.show();
  }

  /**
   * Clears the content of the output channel.
   */
  clearOutputChannel(): void {
    this.outputChannel.clear();
  }

  /**
   * Appends a message to the output channel.
   * @param msg The message to append to the output channel.
   */
  addMsgOutputChannel(msg: string): void {
    this.outputChannel.append(msg);
  }
}
