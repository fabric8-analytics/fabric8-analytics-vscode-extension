import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

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

  test('stackAnalysisLifeCycle should call chain of promises', async () => {
    const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
      exhortSnykToken: 'mockToken',
      dependencyAnalysisReportFilePath: '/path/to/mock/report'
    });
    const manifestFilePathMock = '/path/to/mock/manifest';
    const triggerManifestWsStub = sandbox.stub(multimanifestmodule, 'triggerManifestWs').resolves(true);
    const exhortApiStackAnalysisStub = sandbox.stub(stackAnalysisServices, 'exhortApiStackAnalysis')
      .resolves('<html><body>Mock HTML response</body></html>');
    const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
    const writeFileStub = sandbox.stub(fs, 'writeFile').resolves(true);

    await stackanalysismodule.stackAnalysisLifeCycle(context, manifestFilePathMock);

    expect(triggerManifestWsStub).to.be.calledOnce;
    expect(exhortApiStackAnalysisStub).to.be.calledOnce;
    // are in the exhortApiStackAnalysis .then block
    expect(existsSyncStub).to.be.calledOnce;
    expect(writeFileStub).to.be.calledOnce;
  });

  test('stackAnalysisLifeCycle should handle errors', async () => {
    const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
      exhortSnykToken: 'mockToken',
    });
    const manifestFilePathMock = '/path/to/mock/manifest';
    const triggerManifestWsStub = sandbox.stub(multimanifestmodule, 'triggerManifestWs');
    const handleErrorSpy = sandbox.spy(stackanalysismodule, 'handleError');
    const showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
    const exhortApiStackAnalysisStub = sandbox.stub(stackAnalysisServices, 'exhortApiStackAnalysis')
      .rejects('Mock error message');

    await stackanalysismodule.stackAnalysisLifeCycle(context, manifestFilePathMock);

    expect(getApiConfigStub).to.be.calledOnce;
    expect(triggerManifestWsStub).to.be.calledOnce;
    expect(exhortApiStackAnalysisStub).to.be.calledOnce;
    // are in the exhortApiStackAnalysis .catch block
    expect(handleErrorSpy).to.be.calledOnce;
    expect(showErrorMessageStub).to.be.calledOnce;
  });

  test('validateSnykToken should execute stackAnalysisServices.getSnykTokenValidationService if a valid token is provided', async () => {
    const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
      exhortSnykToken: 'mockToken'
    });
    const getSnykTokenValidationServiceStub = sandbox.stub(stackAnalysisServices, 'getSnykTokenValidationService');

    await stackanalysismodule.validateSnykToken();

    expect(getApiConfigStub).to.be.calledOnce;
    expect(getSnykTokenValidationServiceStub.calledOnceWithExactly({ EXHORT_SNYK_TOKEN: 'mockToken', })).to.be.true;
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
