import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import * as stackanalysismodule from '../src/stackanalysismodule';
import * as multimanifestmodule from '../src/multimanifestmodule';
import * as stackAnalysisServices from '../src/stackAnalysisService';
import * as Config from '../src/config';

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
    expect(getSnykTokenValidationServiceStub.calledOnceWithExactly({ EXHORT_SNYK_TOKEN: 'mockToken', 'EXHORT_DEV_MODE': process.env.VSCEXT_EXHORT_DEV_MODE, 'RHDA_TOKEN': process.env.VSCEXT_TELEMETRY_ID, 'RHDA_SOURCE': process.env.VSCEXT_UTM_SOURCE })).to.be.true;
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
