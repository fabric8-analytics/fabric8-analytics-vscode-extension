import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { DependencyReportPanel } from '../src/dependencyReportPanel';
import { generateRHDAReport } from '../src/stackAnalysis'
import { context } from './vscontext.mock';
import * as templates from '../src/template';

const expect = chai.expect;
chai.use(sinonChai);

suite('StackAnalysis module', () => {
  let sandbox: sinon.SinonSandbox;
  const MockUri = vscode.Uri.file('/mock/path/pom.xml');
  const mockReponse = '<html> mockResponse </html>';

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should ignore unsoported file', async () => {
    const unsupportedUri = vscode.Uri.file('/mock/path/yarn.lock');
    const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse)
    const showInformationMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');

    await generateRHDAReport(context, unsupportedUri);

    expect(authorizeRHDAStub.calledOnce).to.be.false;
    expect(stackAnalysisServiceStub.calledOnce).to.be.false;
    expect(showInformationMessageSpy.calledOnceWith(`File ${unsupportedUri.fsPath} is not supported!!`)).to.be.true;
  });

  test('should generate RHDA report for supported file and successfully save HTML data locally', async () => {
    const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse)
    const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
    const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
      callback(null);
    });

    globalConfig.exhortSnykToken = 'mockToken';

    await generateRHDAReport(context, MockUri);

    expect(authorizeRHDAStub.calledOnce).to.be.true;
    expect(stackAnalysisServiceStub.calledOnce).to.be.true;
    expect(existsSyncStub.calledOnce).to.be.true;
    expect(writeFileStub.calledWithMatch('/tmp/redhatDependencyAnalyticsReport.html', 'mockResponse')).to.be.true;
    expect(DependencyReportPanel.data).to.eq(mockReponse);
  });

  test('should fail to generate RHDA report for supported file', async () => {
    const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').rejects(new Error('Mock Error'));

    globalConfig.exhortSnykToken = '';

    await generateRHDAReport(context, MockUri)
      .then(() => {
        throw (new Error('should have thrown error'))
      })
      .catch(error => {
        expect(error.message).to.eq('Mock Error');
        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(templates.ERROR_TEMPLATE);
      })
  });

  test('should generate RHDA report for supported file successfully but fail to save HTML locally', async () => {
    const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse)
    sandbox.stub(fs, 'existsSync').returns(false);
    const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
      callback(new Error('Mock Error'));
    });

    await generateRHDAReport(context, MockUri)
      .then(() => {
        throw (new Error('should have thrown error'))
      })
      .catch(error => {
        expect(error.message).to.eq('Mock Error');
        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(writeFileStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(mockReponse);
      })
  });

  test('should generate RHDA report for supported file successfully but fail to create directory to save HTML locally', async () => {
    const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
    const stackAnalysisServiceStub = sandbox.stub(exhortServices, 'stackAnalysisService').resolves(mockReponse)
    sandbox.stub(fs, 'existsSync').returns(false);
    const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync').throws(new Error('Mock Error'));

    await generateRHDAReport(context, MockUri)
      .then(() => {
        throw (new Error('should have thrown error'))

      })
      .catch(error => {
        expect(error.message).to.eq('Mock Error');
        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(mkdirSyncStub.calledOnce).to.be.true;
        expect(DependencyReportPanel.data).to.eq(mockReponse);
      })
  });
});
