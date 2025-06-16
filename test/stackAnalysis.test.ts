/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { DependencyReportPanel } from '../src/dependencyReportPanel';
import { executeStackAnalysis } from '../src/stackAnalysis';
import * as templates from '../src/template';
import { DepOutputChannel } from '../src/depOutputChannel';

const expect = chai.expect;
chai.use(sinonChai);
const outputChannel = new DepOutputChannel('test');

suite('StackAnalysis module', () => {
  let sandbox: sinon.SinonSandbox;
  const mockPath = '/mock/path/pom.xml';
  const mockReponse = '<html> mockResponse </html>';

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

  test('should generate RHDA report for supported file', async () => {
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse);

    await executeStackAnalysis(mockPath, outputChannel);

    expect(stackAnalysisServiceStub.calledOnce).to.be.true;
    expect(DependencyReportPanel.data).to.eq(mockReponse);
  });

  test('should fail to generate RHDA report for supported file', async () => {
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').rejects(new Error('Mock Error'));

    await executeStackAnalysis(mockPath, outputChannel)
      .then(() => {
        throw (new Error('should have thrown error'));
      })
      .catch(error => {
        expect(error.message).to.eq('Mock Error');
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(templates.ERROR_TEMPLATE);
      });
  });
});
