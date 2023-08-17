import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import { multimanifestmodule } from '../src/multimanifestmodule';
import { authextension } from '../src/authextension';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { DependencyReportPanel } from '../src/dependencyReportPanel';

const expect = chai.expect;
chai.use(sinonChai);

suite('multimanifest module', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('dependencyAnalyticsReportFlow should process stack analysis for maven when given a pom.xml', async () => {
    const uri = vscode.Uri.file('/path/to/pom.xml');
    const getWorkspaceFolderStub = sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({ uri } as vscode.WorkspaceFolder);
    const processStackAnalysisStub = sandbox.stub(stackanalysismodule, 'processStackAnalysis');

    await multimanifestmodule.dependencyAnalyticsReportFlow(context, uri);

    expect(getWorkspaceFolderStub.calledOnce).to.be.true;
    expect(processStackAnalysisStub.calledOnceWithExactly(context, { uri }, 'maven', uri)).to.be.true;
  });

  test('dependencyAnalyticsReportFlow should call triggerFullStackAnalyse once', async () => {
    let triggerFullStackAnalysisSpy = sandbox.spy(multimanifestmodule, 'triggerFullStackAnalysis');

    await multimanifestmodule.dependencyAnalyticsReportFlow(context, null);

    expect(triggerFullStackAnalysisSpy).to.be.calledOnce;
  });

  test('triggerFullStackAnalysis should trigger full stack analysis for specified workspace folder', async () => {
    const workspaceFolder = { uri: vscode.Uri.file('/path/to/mock/workspace') } as vscode.WorkspaceFolder;
    const findFilesStub = sandbox.stub(vscode.workspace, 'findFiles').resolves([vscode.Uri.file('/path/to/mock/pom.xml')]);
    const processStackAnalysisStub = sandbox.stub(stackanalysismodule, 'processStackAnalysis');

    await multimanifestmodule.triggerFullStackAnalysis(context, workspaceFolder);

    expect(findFilesStub).to.be.calledOnce;
    expect(processStackAnalysisStub.calledOnceWithExactly(context, workspaceFolder, 'maven')).to.be.true;
  });

  test('triggerManifestWs should resolve with true when authorized and create DependencyReportPanel', async () => {
    let authorize_f8_analyticsStub = sandbox.stub(authextension, 'authorize_f8_analytics').resolves(true);
    const createOrShowStub = sandbox.stub(DependencyReportPanel, 'createOrShow');

    let result = await multimanifestmodule.triggerManifestWs(context);

    expect(result).equals(true);
    expect(createOrShowStub.calledOnceWithExactly(context.extensionPath, null)).to.be.true;
    expect(authorize_f8_analyticsStub).to.be.calledOnce;
  });

  test('triggerManifestWs should reject with "Unable to authenticate." when authorization fails', async () => {
    const authStub = sandbox.stub(authextension, 'authorize_f8_analytics').rejects('Authentication failed');

    try {
      await multimanifestmodule.triggerManifestWs(context);
      // The test should not reach this point, so fail if it does
      expect.fail('Function should have rejected');
    } catch (error) {
      expect(error).to.equal('Unable to authenticate.');
    }

    expect(authStub.calledOnceWithExactly(context)).to.be.true;
  });

  test('triggerTokenValidation should call validateSnykToken when provider is "snyk"', async () => {
    const validateSnykTokenStub = sandbox.stub(stackanalysismodule, 'validateSnykToken');

    await multimanifestmodule.triggerTokenValidation('snyk');

    expect(validateSnykTokenStub).to.be.calledOnce;
  });

});
