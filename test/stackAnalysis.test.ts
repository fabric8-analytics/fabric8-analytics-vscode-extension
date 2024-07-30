import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { DependencyReportPanel } from '../src/dependencyReportPanel';
import { executeStackAnalysis } from '../src/stackAnalysis'
import * as templates from '../src/template';

const expect = chai.expect;
chai.use(sinonChai);

suite('StackAnalysis module', () => {
  let sandbox: sinon.SinonSandbox;
  const mockPath = '/mock/path/pom.xml';
  const mockReponse = '<html> mockResponse </html>';

  setup(() => {
    sandbox = sinon.createSandbox();

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => 'mockToken',
        delete: () => sandbox.stub()
      }
    });
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should generate RHDA report for supported file', async () => {
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse)

    await executeStackAnalysis(mockPath);

    expect(stackAnalysisServiceStub.calledOnce).to.be.true;
    expect(DependencyReportPanel.data).to.eq(mockReponse);
  });

  test('should fail to generate RHDA report for supported file', async () => {
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').rejects(new Error('Mock Error'));

    await executeStackAnalysis(mockPath)
      .then(() => {
        throw (new Error('should have thrown error'))
      })
      .catch(error => {
        expect(error.message).to.eq('Mock Error');
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(templates.ERROR_TEMPLATE);
      })
  });
});
