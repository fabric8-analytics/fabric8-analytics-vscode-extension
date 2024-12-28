import * as assert from 'assert';
import * as vscode from 'vscode';

import * as Commands from '../src/commands';

suite('Extension module', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('redhat.fabric8-analytics'));
  });

  test('should activate', async () => {
    const api = await vscode.extensions
      .getExtension('redhat.fabric8-analytics')
      .activate();
    assert.ok(true);
  }).timeout(1 * 60 * 1000);

  test('should register all fabric8 commands', async function () {
    const FABRIC8_COMMANDS: string[] = [
      Commands.STACK_ANALYSIS_COMMAND,
      Commands.STACK_LOGS_COMMAND,
      Commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND,
      Commands.STACK_ANALYSIS_FROM_EDITOR_COMMAND,
      Commands.STACK_ANALYSIS_FROM_EXPLORER_COMMAND,
      Commands.STACK_ANALYSIS_FROM_PIE_BTN_COMMAND,
      Commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND
    ];
    // @ts-ignore
    assert.ok((await vscode.commands.getCommands(true)).includes(...FABRIC8_COMMANDS));
  });
});
