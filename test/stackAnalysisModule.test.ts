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

  suite('stacknalysis module:', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];

    test('processStackAnalysis should call stackAnalysisLifeCycle for maven', async () => {
      let stackAnalysisLifeCycleSpy = sandbox.spy(stackanalysismodule, 'stackAnalysisLifeCycle');

      await stackanalysismodule.processStackAnalysis(
        context,
        workspaceFolder,
        'maven',
        vscode.Uri.file('path/to/mock/pom.xml')
      );

      expect(stackAnalysisLifeCycleSpy.calledOnceWithExactly(context, 'path/to/mock/pom.xml')).to.be.true;
    });

    test('processStackAnalysis should call stackAnalysisLifeCycle for npm', async () => {
      let stackAnalysisLifeCycleSpy = sandbox.spy(stackanalysismodule, 'stackAnalysisLifeCycle');

      await stackanalysismodule.processStackAnalysis(
        context,
        workspaceFolder,
        'npm',
        vscode.Uri.file('path/to/mock/package.json')
      );

      expect(stackAnalysisLifeCycleSpy.calledOnceWithExactly(context, 'path/to/mock/package.json')).to.be.true;
    });

    test('stackAnalysisLifeCycle should call chain of promises', async () => {
      const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
        exhortSnykToken: 'mockToken',
        dependencyAnalysisReportFilePath: 'path/to/mock/report'
      });
      const manifestFilePathMock = 'path/to/mock/manifest';
      const triggerManifestWsStub = sandbox.stub(multimanifestmodule, 'triggerManifestWs').resolves(true);
      const exhortApiStackAnalysisStub = sandbox.stub(stackAnalysisServices, 'exhortApiStackAnalysis')
        .resolves('<html><body>Mock HTML response</body></html>');

      await stackanalysismodule.stackAnalysisLifeCycle(context, manifestFilePathMock);

      expect(getApiConfigStub).to.be.calledOnce;
      expect(triggerManifestWsStub).to.be.calledOnce;
      expect(exhortApiStackAnalysisStub).to.be.calledOnce;
    });

    test('stackAnalysisLifeCycle should handle errors', async () => {
      const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
        exhortSnykToken: 'mockToken',
        dependencyAnalysisReportFilePath: 'path/to/mock/report'
      });
      const manifestFilePathMock = 'path/to/mock/manifest';
      const errorMessage = new Error('Mock error message');
      const triggerManifestWsStub = sandbox.stub(multimanifestmodule, 'triggerManifestWs').resolves(true);
      const exhortApiStackAnalysisStub = sandbox.stub(stackAnalysisServices, 'exhortApiStackAnalysis')
        .rejects(errorMessage);
      const handleErrorSpy = sandbox.spy(stackanalysismodule, 'handleError');
      const showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');


      await stackanalysismodule.stackAnalysisLifeCycle(context, manifestFilePathMock);

      expect(getApiConfigStub).to.be.calledOnce;
      expect(triggerManifestWsStub).to.be.calledOnce;
      expect(exhortApiStackAnalysisStub).to.be.calledOnce;
      expect(handleErrorSpy).to.be.calledOnceWith(errorMessage);
      expect(showErrorMessageStub).to.be.calledOnceWith(errorMessage);
    });

    test('validateSnykToken should execute stackAnalysisServices.getSnykTokenValidationService if a valid token is provided', async () => {
      const getApiConfigStub = sandbox.stub(Config, 'getApiConfig').returns({
        exhortSnykToken: 'mockToken'
      });
      const getSnykTokenValidationServiceStub = sandbox.stub(stackAnalysisServices, 'getSnykTokenValidationService');

      await stackanalysismodule.validateSnykToken();

      expect(getApiConfigStub).to.be.calledOnce;
      expect(getSnykTokenValidationServiceStub.calledOnceWithExactly({ exhortSnykToken: 'mockToken', })).to.be.true;
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
});
