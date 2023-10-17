import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import * as multimanifestmodule from '../src/multimanifestmodule';
import * as authextension from '../src/authextension';
import * as stackanalysismodule from '../src/stackanalysismodule';
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

  test('redhatDependencyAnalyticsReportFlow should process stack analysis for maven when given a pom.xml', async () => {
    const uri = vscode.Uri.file('/path/to/pom.xml');
    const getWorkspaceFolderStub = sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({ uri } as vscode.WorkspaceFolder);
    const processStackAnalysisStub = sandbox.stub(stackanalysismodule, 'processStackAnalysis');

    await multimanifestmodule.redhatDependencyAnalyticsReportFlow(context, uri);

    expect(getWorkspaceFolderStub.calledOnce).to.be.true;
    expect(processStackAnalysisStub.calledOnceWithExactly(context, { uri }, 'maven', uri)).to.be.true;
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
      expect(error).to.equal('Unable to authenticate. Authentication failed');
    }

    expect(authStub.calledOnceWithExactly(context)).to.be.true;
  });

  test('triggerTokenValidation should call validateSnykToken when provider is "snyk"', async () => {
    const validateSnykTokenStub = sandbox.stub(stackanalysismodule, 'validateSnykToken');

    await multimanifestmodule.triggerTokenValidation('snyk');

    expect(validateSnykTokenStub).to.be.calledOnce;
  });

});
