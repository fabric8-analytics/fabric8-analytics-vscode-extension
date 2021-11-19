import * as assert from 'assert';
import * as vscode from 'vscode';

import { Commands } from '../src/commands';

suite('Fabric8 Analytics Extension', () => {
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
      Commands.TRIGGER_FULL_STACK_ANALYSIS,
      Commands.TRIGGER_STACK_LOGS,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR,
    ];
    // @ts-ignore
    assert.ok((await vscode.commands.getCommands(true)).includes(...FABRIC8_COMMANDS));
  });

  test('should trigger fabric8-analytics full stack report activate', async () => {
    await vscode.commands
      .executeCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS)
      .then(
        (res) => {
          assert.ok(true);
        },
        (reason: any) => {
          assert.equal(reason.name, 'TypeError');
          assert.equal(
            reason.message,
            `Running the contributed command: 'fabric8.stackAnalysis' failed.`
          );
        }
      );
  });
});
