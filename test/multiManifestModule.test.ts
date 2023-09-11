import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import * as multimanifestmodule from '../src/multimanifestmodule';
import * as contextHandler from '../src/contextHandler';
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
    const uri = vscode.Uri.file('path/to/pom.xml');
    const stackAnalysisLifeCycleStub = sandbox.stub(stackanalysismodule, 'stackAnalysisLifeCycle');

    await multimanifestmodule.redhatDependencyAnalyticsReportFlow(context, uri);

    expect(stackAnalysisLifeCycleStub.calledOnceWithExactly(context, uri.fsPath)).to.be.true;
  });

  test('redhatDependencyAnalyticsReportFlow should show an information message for an unsupported file', async () => {
    const showInformationMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');

    const uri = vscode.Uri.file('path/to/unsupported.txt');

    await multimanifestmodule.redhatDependencyAnalyticsReportFlow(context, uri);

    expect(showInformationMessageSpy).to.be.calledWith('File /path/to/unsupported.txt is not supported!!');
  });

  test('triggerManifestWs should resolve with true when authorized and create DependencyReportPanel', async () => {
    let loadContextDataStub = sandbox.stub(contextHandler, 'loadContextData').resolves(true);
    const createOrShowWebviewPanelStub = sandbox.stub(DependencyReportPanel, 'createOrShowWebviewPanel');

    try {
      await multimanifestmodule.triggerManifestWs(context);
      // If triggerManifestWs resolves successfully, the test will pass.
    } catch (error) {
      // If triggerManifestWs rejects, the test will fail with the error message.
      expect.fail('Expected triggerManifestWs to resolve, but it rejected with an error: ' + error);
    }

    expect(loadContextDataStub.calledOnce).to.be.true;
    expect(createOrShowWebviewPanelStub.calledOnce).to.be.true;
  });

  test('triggerManifestWs should reject with "Unable to authenticate." when authorization fails', async () => {
    let loadContextDataStub = sandbox.stub(contextHandler, 'loadContextData').resolves(false);
    const createOrShowWebviewPanelStub = sandbox.stub(DependencyReportPanel, 'createOrShowWebviewPanel');

    try {
      await multimanifestmodule.triggerManifestWs(context);
      // The test should not reach this point, so fail if it does
      expect.fail('Function should have rejected');
    } catch (error) {
      expect(error).to.equal('Unable to authenticate.');
    }

    expect(loadContextDataStub.calledOnce).to.be.true;
    expect(createOrShowWebviewPanelStub.called).to.be.false;
  });

  test('triggerTokenValidation should call validateSnykToken when provider is "snyk"', async () => {
    const validateSnykTokenStub = sandbox.stub(stackanalysismodule, 'validateSnykToken');

    await multimanifestmodule.triggerTokenValidation('snyk');

    expect(validateSnykTokenStub.calledOnce).to.be.true;
  });

  test('triggerTokenValidation should end when undefined provider is called', async () => {
    const validateSnykTokenStub = sandbox.stub(stackanalysismodule, 'validateSnykToken');

    await multimanifestmodule.triggerTokenValidation('undefined');

    expect(validateSnykTokenStub.called).to.be.false;
  });

});
