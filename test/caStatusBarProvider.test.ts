import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { caStatusBarProvider } from '../src/caStatusBarProvider';
import { PromptText } from '../src/constants';
import * as commands from '../src/commands';

const expect = chai.expect;
chai.use(sinonChai);

suite('CAStatusBarProvider module', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should show summary with provided text and URI', async () => {
        const text = 'Mock Text';
        const uri = 'file:///mock/path';

        caStatusBarProvider.showSummary(text, uri);

        expect(caStatusBarProvider['statusBarItem'].text).to.equal(text);
        expect(caStatusBarProvider['statusBarItem'].tooltip).to.equal(PromptText.FULL_STACK_PROMPT_TEXT);
        expect(caStatusBarProvider['statusBarItem'].command).to.deep.equal({
            title: PromptText.FULL_STACK_PROMPT_TEXT,
            command: commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND,
            arguments: [vscode.Uri.parse(uri)]
        });
    });

    test('should set error message and command', () => {
        caStatusBarProvider.setError();

        expect(caStatusBarProvider['statusBarItem'].text).to.equal('$(error) RHDA analysis has failed');
        expect(caStatusBarProvider['statusBarItem'].command).to.deep.equal({
            title: PromptText.LSP_FAILURE_TEXT,
            command: commands.STACK_LOGS_COMMAND,
        });
    });

    test('should dispose status bar item', () => {
        const disposeStub = sandbox.stub(caStatusBarProvider['statusBarItem'], 'dispose');

        caStatusBarProvider.dispose();

        expect(disposeStub.calledOnce).to.be.true;
    });
});