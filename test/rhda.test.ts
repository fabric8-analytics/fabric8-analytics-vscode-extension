import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import * as stackAnalysis from '../src/stackAnalysis';
import * as imageAnalysis from '../src/imageAnalysis';
import { globalConfig } from '../src/config';
import * as rhda from '../src/rhda'
import { context } from './vscontext.mock';
import { DependencyReportPanel } from '../src/dependencyReportPanel';

const expect = chai.expect;
chai.use(sinonChai);

suite('RHDA module', () => {
    let sandbox: sinon.SinonSandbox;
    const mockInvalidPath = '/mock/path/yarn.lock';
    const mockGoPath = '/mock/path/go.mod';
    const mockMavenPath = '/mock/path/pom.xml';
    const mockNpmPath = '/mock/path/package.json';
    const mockPythonPath = '/mock/path/requirements.txt';
    const mockGradlePath = '/mock/path/build.gradle';
    const mockDockerfilePath = '/mock/path/Dockerfile';
    const mockContainerfilePath = '/mock/path/Containerfile';
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

    test('should ignore unsoported file', async () => {
        const unsupportedFilePath = mockInvalidPath;
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').resolves(mockReponse)
        const imageAnalysisServiceStub = sandbox.stub(imageAnalysis, 'executeDockerImageAnalysis').resolves(mockReponse)
        const showInformationMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');

        await rhda.generateRHDAReport(context, unsupportedFilePath);

        expect(authorizeRHDAStub.calledOnce).to.be.false;
        expect(stackAnalysisServiceStub.calledOnce).to.be.false;
        expect(imageAnalysisServiceStub.calledOnce).to.be.false;
        expect(showInformationMessageSpy.calledOnceWith(`File ${unsupportedFilePath} is not supported!!`)).to.be.true;
    });

    test('should receive RHDA report for supported dependency file and successfully save HTML data locally', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').resolves(mockReponse)
        const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
            callback(null);
        });

        await rhda.generateRHDAReport(context, mockGoPath);

        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(writeFileStub.calledWithMatch('/tmp/redhatDependencyAnalyticsReport.html', mockReponse)).to.be.true;
    });

    test('should receive RHDA report for supported image file and successfully save HTML data locally', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const imageAnalysisServiceStub = sandbox.stub(imageAnalysis, 'executeDockerImageAnalysis').resolves(mockReponse)
        const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
            callback(null);
        });

        await rhda.generateRHDAReport(context, mockDockerfilePath);

        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(imageAnalysisServiceStub.calledOnce).to.be.true;
        expect(writeFileStub.calledWithMatch('/tmp/redhatDependencyAnalyticsReport.html', mockReponse)).to.be.true;
    });

    test('should fail to generate RHDA report for supported dependency file', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').rejects(new Error('Mock Error'));

        await rhda.generateRHDAReport(context, mockMavenPath)
            .then(() => {
                throw (new Error('should have thrown error'))
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(authorizeRHDAStub.calledOnce).to.be.true;
                expect(stackAnalysisServiceStub.calledOnce).to.be.true;
            })
    });

    test('should fail to generate RHDA report for supported image file', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const imageAnalysisServiceStub = sandbox.stub(imageAnalysis, 'executeDockerImageAnalysis').rejects(new Error('Mock Error'));

        await rhda.generateRHDAReport(context, mockContainerfilePath)
            .then(() => {
                throw (new Error('should have thrown error'))
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(authorizeRHDAStub.calledOnce).to.be.true;
                expect(imageAnalysisServiceStub.calledOnce).to.be.true;
            })
    });

    test('should generate RHDA report for supported file successfully but fail to save HTML locally', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').resolves(mockReponse)
        const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
            callback(new Error('Mock Error'));
        });

        await rhda.generateRHDAReport(context, mockNpmPath)
            .then(() => {
                throw (new Error('should have thrown error'))
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(authorizeRHDAStub.calledOnce).to.be.true;
                expect(stackAnalysisServiceStub.calledOnce).to.be.true;
                expect(writeFileStub.calledOnce).to.be.true;
            })
    });

    test('should generate RHDA report for supported file successfully but fail to create directory to save HTML locally', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').resolves(mockReponse)
        sandbox.stub(fs, 'existsSync').returns(false);
        const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync').throws(new Error('Mock Error'));

        await rhda.generateRHDAReport(context, mockPythonPath)
            .then(() => {
                throw (new Error('should have thrown error'))

            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(authorizeRHDAStub.calledOnce).to.be.true;
                expect(stackAnalysisServiceStub.calledOnce).to.be.true;
                expect(mkdirSyncStub.calledOnce).to.be.true;
            })
    });

    test('should trigger and update webview panel', async () => {
        const authorizeRHDAStub = sandbox.stub(globalConfig, 'authorizeRHDA').resolves();
        const stackAnalysisServiceStub = sandbox.stub(stackAnalysis, 'executeStackAnalysis').resolves(mockReponse)
        const writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((path, data, callback) => {
            callback(null);
        });

        await rhda.generateRHDAReport(context, mockGradlePath);

        expect(authorizeRHDAStub.calledOnce).to.be.true;
        expect(stackAnalysisServiceStub.calledOnce).to.be.true;
        expect(writeFileStub.calledWithMatch('/tmp/redhatDependencyAnalyticsReport.html', 'mockResponse')).to.be.true;

        expect(DependencyReportPanel.currentPanel).to.exist;
        expect(DependencyReportPanel.data).to.eq(null);

        rhda.updateCurrentWebviewPanel(mockReponse)

        expect(DependencyReportPanel.data).to.eq(mockReponse);
    });
});