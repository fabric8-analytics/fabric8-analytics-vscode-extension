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
   * Shows the output channel in the VS Code UI.
   */
  show(): void {
    this.outputChannel.show();
  }

  /**
   * Clears the content of the output channel.
   */
  clear(): void {
    this.outputChannel.clear();
  }

  debug(msg: string) { this.write('DEBUG', msg); }
  info(msg: string) { this.write('INFO', msg); }
  warn(msg: string) { this.write('WARN', msg); }
  error(msg: string) { this.write('ERROR', msg); }

  private write(label: string, msg: string): void {
    const datetime = new Date().toLocaleString();
    this.outputChannel.appendLine(`${label} ${datetime}: ${msg}`);
  }
}
