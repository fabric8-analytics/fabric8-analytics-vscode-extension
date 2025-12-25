/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as vscode from 'vscode';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { AnalysisMatcher } from '../src/fileHandler';
import { DepOutputChannel } from '../src/depOutputChannel';
import * as path from 'path';
import { MockTokenProvider } from '../src/tokenProvider';

const expect = chai.expect;
chai.use(sinonChai);

suite('File Handler', async () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });
  test('test file handler exclusion', async () => {
    const fileHandler = new AnalysisMatcher();

    vscode.workspace.getConfiguration('redHatDependencyAnalytics').update('exclude', ['**/requirements.txt']);

    const manifestFile = path.resolve(vscode.workspace.workspaceFolders![0].uri.fsPath, 'requirements.txt');
    const doc = await vscode.workspace.openTextDocument(manifestFile);

    const outputChannel = new DepOutputChannel('sample');
    const debuglogSpy = sandbox.stub(outputChannel, 'debug');

    await fileHandler.handle(new MockTokenProvider(), doc, outputChannel);

    expect(debuglogSpy).to.be.calledOnce;
    expect(debuglogSpy).to.be.calledWithExactly(`skipping "${manifestFile}" due to matching **/requirements.txt`);
  });
});