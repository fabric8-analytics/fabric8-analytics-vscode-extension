import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { multimanifestmodule } from '../src/multimanifestmodule';
import { stackAnalysisServices } from '../src/stackAnalysisService';
import { Config } from '../src/config';

const expect = chai.expect;
chai.use(sinonChai);

suite('stackanalysis module', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('processStackAnalysis should call stackAnalysisLifeCycle for maven', async () => {
    const workspaceFolder = { uri: vscode.Uri.file('/path/to/mockFolder') } as vscode.WorkspaceFolder;
    let stackAnalysisLifeCycleStub = sandbox.stub(stackanalysismodule, 'stackAnalysisLifeCycle');

    await stackanalysismodule.processStackAnalysis(
      context,
      workspaceFolder,
      'maven'
    );

    expect(stackAnalysisLifeCycleStub.calledOnceWithExactly(context, '/path/to/mockFolder/pom.xml')).to.be.true;
  });

  test('processStackAnalysis should call stackAnalysisLifeCycle for npm', async () => {
    const workspaceFolder = { uri: vscode.Uri.file('/path/to/mockFolder') } as vscode.WorkspaceFolder;
    let stackAnalysisLifeCycleStub = sandbox.stub(stackanalysismodule, 'stackAnalysisLifeCycle');

    await stackanalysismodule.processStackAnalysis(
      context,
      workspaceFolder,
      'npm'
    );

    expect(stackAnalysisLifeCycleStub.calledOnceWithExactly(context, '/path/to/mockFolder/package.json')).to.be.true;
  });

  test('processStackAnalysis should call stackAnalysisLifeCycle for golang', async () => {
    const workspaceFolder = { uri: vscode.Uri.file('/path/to/mockFolder') } as vscode.WorkspaceFolder;
    let stackAnalysisLifeCycleStub = sandbox.stub(stackanalysismodule, 'stackAnalysisLifeCycle');

    await stackanalysismodule.processStackAnalysis(
      context,
      workspaceFolder,
      'golang'
    );

    expect(stackAnalysisLifeCycleStub.calledOnceWithExactly(context, '/path/to/mockFolder/go.mod')).to.be.true;
  });

  test('processStackAnalysis should call stackAnalysisLifeCycle for pypi', async () => {
    const workspaceFolder = { uri: vscode.Uri.file('/path/to/mockFolder') } as vscode.WorkspaceFolder;
    let stackAnalysisLifeCycleStub = sandbox.stub(stackanalysismodule, 'stackAnalysisLifeCycle');

    await stackanalysismodule.processStackAnalysis(
      context,
      workspaceFolder,
      'pypi'
    );

    expect(stackAnalysisLifeCycleStub.calledOnceWithExactly(context, '/path/to/mockFolder/requirements.txt')).to.be.true;
  });

  test('stackAnalysisLifeCycle should call chain of promises', async () => {
    const withProgressSpy = sandbox.spy(vscode.window, 'withProgress');
    const triggerManifestWsStub = sandbox.stub(multimanifestmodule, 'triggerManifestWs');
    const exhortApiStackAnalysisStub = sandbox.stub(stackAnalysisServices, 'exhortApiStackAnalysis');

    await stackanalysismodule.stackAnalysisLifeCycle(context, '/path/to/mock/manifest');

    expect(withProgressSpy).to.be.calledOnce;
    expect(triggerManifestWsStub).to.be.calledOnce;
    expect(exhortApiStackAnalysisStub).to.be.calledOnce;
  });

  test('validateSnykToken should execute stackAnalysisServices.getSnykTokenValidationService if a valid token is provided', async () => {
    const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
      exhortSnykToken: 'mockToken'
    });
    const getSnykTokenValidationServiceStub = sandbox.stub(stackAnalysisServices, 'getSnykTokenValidationService');

    await stackanalysismodule.validateSnykToken();

    expect(getApiConfigStub).to.be.calledOnce;
    expect(getSnykTokenValidationServiceStub.calledOnceWithExactly({ EXHORT_SNYK_TOKEN: 'mockToken', 'EXHORT_DEV_MODE': process.env.EXHORT_DEV_MODE, 'RHDA_TOKEN': process.env.TELEMETRY_ID, 'RHDA_SOURCE': process.env.UTM_SOURCE })).to.be.true;
  });

  test('validateSnykToken should show information message if no token is provided', async () => {
    const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
      exhortSnykToken: ''
    });
    const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

    await stackanalysismodule.validateSnykToken();

    expect(getApiConfigStub).to.be.calledOnce;
    expect(showInformationMessageStub).to.be.calledOnce;
  });

});
