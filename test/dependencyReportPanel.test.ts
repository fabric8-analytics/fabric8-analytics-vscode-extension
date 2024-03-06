import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { DependencyReportPanel } from '../src/dependencyReportPanel';
import * as Templates from '../src/template';
import { DEFAULT_RHDA_REPORT_FILE_PATH } from '../src/constants';

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

  test('createOrShowWebviewPanel should create a new panel', async () => {
    const createWebviewPanelSpy = sandbox.spy(vscode.window, 'createWebviewPanel');

    expect(DependencyReportPanel.currentPanel).to.be.undefined;

    DependencyReportPanel.createOrShowWebviewPanel();

    expect(createWebviewPanelSpy).to.be.calledOnce;
    expect(DependencyReportPanel.currentPanel).to.exist;
    expect(DependencyReportPanel.data).to.equal(null);
    expect(DependencyReportPanel.currentPanel.getWebviewPanelHtml()).to.equal(Templates.LOADER_TEMPLATE);
  });

  test('createOrShowWebviewPanel should update webview if panel exists and is visible', async () => {
    const createWebviewPanelSpy = sandbox.spy(vscode.window, 'createWebviewPanel');
    const getPanelVisibilitySpy = sandbox.spy(DependencyReportPanel.currentPanel, 'getPanelVisibility');

    expect(DependencyReportPanel.currentPanel).to.exist;

    DependencyReportPanel.createOrShowWebviewPanel();

    expect(getPanelVisibilitySpy.calledOnce).to.be.true;
    expect(DependencyReportPanel.currentPanel.getPanelVisibility()).to.be.true;
    expect(createWebviewPanelSpy.called).to.be.false;
  });

  test('createOrShowWebviewPanel should reveal webview if panel exists and is not visible', async () => {
    const createWebviewPanelSpy = sandbox.spy(vscode.window, 'createWebviewPanel');
    const getPanelVisibilityStub = sandbox.stub(DependencyReportPanel.currentPanel, 'getPanelVisibility').returns(false);

    expect(DependencyReportPanel.currentPanel).to.exist;

    DependencyReportPanel.createOrShowWebviewPanel();

    expect(getPanelVisibilityStub.calledOnce).to.be.true;
    expect(DependencyReportPanel.currentPanel.getPanelVisibility()).to.be.false;
    expect(createWebviewPanelSpy.called).to.be.false;
  });

  test('doUpdatePanel should update data and render HTML', async () => {
    const data = '<html><body>Mock data</body></html>';

    DependencyReportPanel.currentPanel.doUpdatePanel(data);

    expect(DependencyReportPanel.data).equals(data);
    expect(DependencyReportPanel.currentPanel.getWebviewPanelHtml()).to.equal(data);
  });

  test('doUpdatePanel should update data and render error', async () => {
    const data = 'error';

    DependencyReportPanel.currentPanel.doUpdatePanel(data);

    expect(DependencyReportPanel.data).equals(Templates.ERROR_TEMPLATE);
    expect(DependencyReportPanel.currentPanel.getWebviewPanelHtml()).to.equal(Templates.ERROR_TEMPLATE);
  });

  test('dispose should dispose of current panel with RHDA report path setting', async () => {

    const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
    const unlinkSyncStub = sandbox.stub(fs, 'unlinkSync');

    DependencyReportPanel.currentPanel.dispose();

    expect(existsSyncStub).to.be.calledWith(DEFAULT_RHDA_REPORT_FILE_PATH);
    expect(unlinkSyncStub).to.be.calledWith(DEFAULT_RHDA_REPORT_FILE_PATH);
    expect(DependencyReportPanel.data).equals(null);
    expect(DependencyReportPanel.currentPanel).equals(undefined);
  });
});
