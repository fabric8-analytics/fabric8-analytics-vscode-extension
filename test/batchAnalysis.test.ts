/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { DependencyReportPanel } from '../src/dependencyReportPanel';
import { executeBatchStackAnalysis } from '../src/batchAnalysis';
import * as templates from '../src/template';
import { DepOutputChannel } from '../src/depOutputChannel';
import { MockTokenProvider } from '../src/tokenProvider';

const expect = chai.expect;
chai.use(sinonChai);
const outputChannel = new DepOutputChannel('test');

suite('BatchAnalysis module', async () => {
  let sandbox: sinon.SinonSandbox;
  const mockWorkspaceRoot = '/mock/workspace/root';
  const mockResponse = '<html> mockBatchResponse </html>';

  setup(() => {
    DependencyReportPanel.createOrShowWebviewPanel();
    sandbox = sinon.createSandbox();

    globalConfig.linkToSecretStorage({
      secrets: {
        onDidChange: sandbox.stub(),
        store: () => sandbox.stub() as any,
        get: async () => 'mockToken',
        delete: () => sandbox.stub() as any
      }
    });
  });

  teardown(() => {
    DependencyReportPanel.currentPanel?.dispose();
    sandbox.restore();
  });

  test('should generate batch RHDA report for workspace', async () => {
    const batchServiceStub = sandbox.stub(exhortServices, 'batchStackAnalysisService').resolves(mockResponse);

    await executeBatchStackAnalysis(new MockTokenProvider(), mockWorkspaceRoot, outputChannel);

    expect(batchServiceStub.calledOnce).to.be.true;
    expect(DependencyReportPanel.data).to.eq(mockResponse);
  });

  test('should fail to generate batch RHDA report for workspace', async () => {
    const batchServiceStub = sandbox.stub(exhortServices, 'batchStackAnalysisService').rejects(new Error('Batch Mock Error'));

    await executeBatchStackAnalysis(new MockTokenProvider(), mockWorkspaceRoot, outputChannel)
      .then(() => {
        throw (new Error('should have thrown error'));
      })
      .catch(error => {
        expect(error.message).to.eq('Batch Mock Error');
        expect(batchServiceStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(templates.ERROR_TEMPLATE);
      });
  });

  test('should propagate exclude patterns as workspaceDiscoveryIgnore', async () => {
    const batchServiceStub = sandbox.stub(exhortServices, 'batchStackAnalysisService').resolves(mockResponse);

    await executeBatchStackAnalysis(new MockTokenProvider(), mockWorkspaceRoot, outputChannel);

    const callArgs = batchServiceStub.firstCall.args;
    expect(callArgs[0]).to.eq(mockWorkspaceRoot);
    const options = callArgs[1];
    expect(options).to.have.property('workspaceDiscoveryIgnore');
    expect(options.workspaceDiscoveryIgnore).to.be.an('array');
  });

  test('should propagate batch settings from config', async () => {
    const batchServiceStub = sandbox.stub(exhortServices, 'batchStackAnalysisService').resolves(mockResponse);

    await executeBatchStackAnalysis(new MockTokenProvider(), mockWorkspaceRoot, outputChannel);

    const options = batchServiceStub.firstCall.args[1];
    expect(options).to.have.property('batchConcurrency', globalConfig.batchConcurrency);
    expect(options).to.have.property('continueOnError', globalConfig.continueOnError);
    expect(options).to.have.property('batchMetadata', globalConfig.batchMetadata);
  });

  test('should use token from tokenProvider for authentication', async () => {
    const batchServiceStub = sandbox.stub(exhortServices, 'batchStackAnalysisService').resolves(mockResponse);
    const tokenProvider = new MockTokenProvider('mock-oidc-token');

    await executeBatchStackAnalysis(tokenProvider, mockWorkspaceRoot, outputChannel);

    const options = batchServiceStub.firstCall.args[1];
    expect(options).to.have.property('TRUSTIFY_DA_TOKEN', 'mock-oidc-token');
  });
});
