import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { Config } from '../src/config';
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

    DependencyReportPanel.createOrShowWebviewPanel();

    expect(createWebviewPanelSpy).to.be.calledOnce;
    expect(DependencyReportPanel.currentPanel).to.exist;
  });

  test('doUpdatePanel should render and update data', async () => {
    const data = '<html><body>Mock data</body></html>';

    DependencyReportPanel.createOrShowWebviewPanel();
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

    DependencyReportPanel.createOrShowWebviewPanel();
    DependencyReportPanel.currentPanel.dispose();

    expect(existsSyncStub).to.be.calledWith('mockFilePath');
    expect(unlinkSyncStub).to.be.calledWith('mockFilePath');
    expect(DependencyReportPanel.data).equals(null);
    expect(DependencyReportPanel.currentPanel).equals(undefined);
  });
});
