import * as assert from 'assert';
import * as vscode from 'vscode';

import * as myExtension from '../src/extension';
import {Commands} from '../src/commands';

suite("Fabric8 Analytics Extension", () => {

    test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('redhat.fabric8-analytics'));
	});

    test('should activate', function () {
		this.timeout(1 * 60 * 1000);
		return vscode.extensions.getExtension('redhat.fabric8-analytics').activate().then((api) => {
			assert.ok(true);
		});
	});

	test('should register all fabric8 commands', function () {
		return vscode.commands.getCommands(true).then((commands) =>
		{
			const FABRIC8_COMMANDS = [
				Commands.TRIGGER_STACK_ANALYSIS
			];
			let foundFabric8Commands = commands.filter(function(value){
				return FABRIC8_COMMANDS.indexOf(value)>=0 || value.startsWith('extension.');
			});
			assert.equal(foundFabric8Commands.length ,FABRIC8_COMMANDS.length, 'Some fabric8 commands are not registered properly or a new command is not added to the test');
		});
	});

});
