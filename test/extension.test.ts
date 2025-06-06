import * as assert from 'assert';
import * as vscode from 'vscode';

import * as commands from '../src/commands';

suite('Extension module', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('redhat.fabric8-analytics'));
  });

  test('should activate', async () => {
    await vscode.extensions
      .getExtension('redhat.fabric8-analytics')
      .activate();
    assert.ok(true);
  }).timeout(1 * 60 * 1000);

  test('should register all fabric8 commands', async function () {
    const FABRIC8_COMMANDS: string[] = [
      commands.STACK_ANALYSIS_COMMAND,
      commands.STACK_LOGS_COMMAND,
      commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND,
      commands.STACK_ANALYSIS_FROM_EDITOR_COMMAND,
      commands.STACK_ANALYSIS_FROM_EXPLORER_COMMAND,
      commands.STACK_ANALYSIS_FROM_PIE_BTN_COMMAND,
      commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND
    ];
    // @ts-expect-error
    assert.ok((await vscode.commands.getCommands(true)).includes(...FABRIC8_COMMANDS));
  });
});
