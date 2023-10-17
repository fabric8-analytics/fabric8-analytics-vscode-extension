import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import * as Config from '../src/config';
import { context } from './vscontext.mock';
import { DependencyReportPanel } from '../src/dependencyReportPanel';

const expect = chai.expect;
chai.use(sinonChai);

suite('DependencyReportPanel Modules', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('createOrShow should create a new panel', async () => {
    const createWebviewPanelSpy = sandbox.spy(vscode.window, 'createWebviewPanel');

    DependencyReportPanel.createOrShow(context.extensionPath, null);

    expect(createWebviewPanelSpy).to.be.calledOnce;
    expect(DependencyReportPanel.currentPanel).to.exist;
  });

  test('doUpdatePanel should render and update data', async () => {
    const data = '<html><body>Mock data</body></html>';

    DependencyReportPanel.createOrShow(context.extensionPath, null);
    DependencyReportPanel.currentPanel.doUpdatePanel(data);

    expect(DependencyReportPanel.data).equals(data);
  });

  test('dispose current panel', async () => {
    const data = '<html><body>Mock data</body></html>';
    sandbox.stub(Config, 'getApiConfig').returns({
      redHatDependencyAnalyticsReportFilePath: 'mockFilePath',
    });
    const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
    const unlinkSyncStub = sandbox.stub(fs, 'unlinkSync');

    DependencyReportPanel.createOrShow(context.extensionPath, data);
    DependencyReportPanel.currentPanel.dispose();

    expect(existsSyncStub).to.be.calledWith('mockFilePath');
    expect(unlinkSyncStub).to.be.calledWith('mockFilePath');
    expect(DependencyReportPanel.data).equals(null);
    expect(DependencyReportPanel.currentPanel).equals(undefined);
  });
});
