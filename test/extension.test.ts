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
    const commands = await vscode.commands.getCommands(true);
    const FABRIC8_COMMANDS: string[] = [
      Commands.TRIGGER_FULL_STACK_ANALYSIS,
      Commands.TRIGGER_STACK_LOGS,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN,
      Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR,
    ];
    let foundFabric8Commands = commands.filter(function (value) {
      return (
        FABRIC8_COMMANDS.indexOf(value) >= 0 ||
        value.startsWith('extension.fabric8')
      );
    });
    assert.deepStrictEqual(FABRIC8_COMMANDS, foundFabric8Commands);
  });

  test('should trigger fabric8-analytics full stack report activate', async () => {
    await vscode.commands
      .executeCommand(Commands.TRIGGER_FULL_STACK_ANALYSIS)
      .then(
        res => {
          assert.ok(true);
        },
        (reason: any) => {
          assert.equal(reason.name, 'Error');
          assert.equal(
            reason.message,
            `Running the contributed command: 'extension.fabric8AnalyticsWidgetFullStack' failed.`
          );
        }
      );
  });
});
