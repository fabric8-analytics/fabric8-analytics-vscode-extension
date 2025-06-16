/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { executeDockerImageAnalysis } from '../src/imageAnalysis';
import * as rhda from '../src/rhda';
import { DepOutputChannel } from '../src/depOutputChannel';

const expect = chai.expect;
chai.use(sinonChai);
const outputChannel = new DepOutputChannel('test');

suite('ImageAnalysis module', () => {
    let sandbox: sinon.SinonSandbox;
    const mockPath = '/mock/path/to/file';
    const mockReponse = '<html> mockResponse </html>';
    const mockFileContent = `
ARG ARG_IMAGE=alpine
ARG ARG_TAG=latest
FROM --platform=linux/amd64 \${ARG_IMAGE}:\${ARG_TAG} as stage1$ARG_FAKE
FROM ubuntu
FROM scratch
    `;
    const encodedMockFileContent = Buffer.from(mockFileContent, 'utf-8');

    setup(() => {
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
        sandbox.restore();
    });

    test('should generate RHDA report for file', async () => {
        const imageAnalysisServiceStub = sandbox.stub(exhortServices, 'imageAnalysisService').resolves(mockReponse);
        sandbox.stub(fs, 'readFileSync').returns(encodedMockFileContent);
        const updateCurrentWebviewPanelSpy = sandbox.spy(rhda, 'updateCurrentWebviewPanel');

        const response = await executeDockerImageAnalysis(mockPath, outputChannel);

        expect(imageAnalysisServiceStub.calledOnce).to.be.true;
        expect(response).to.eq(mockReponse);
        expect(updateCurrentWebviewPanelSpy.calledOnceWithExactly(response)).to.be.true;
    });

    test('should fail to generate RHDA report for file', async () => {
        const imageAnalysisServiceStub = sandbox.stub(exhortServices, 'imageAnalysisService').rejects(new Error('Mock Error'));
        sandbox.stub(fs, 'readFileSync').returns(encodedMockFileContent);
        const updateCurrentWebviewPanelSpy = sandbox.spy(rhda, 'updateCurrentWebviewPanel');

        await executeDockerImageAnalysis(mockPath, outputChannel)
            .then(() => {
                throw (new Error('should have thrown error'));
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(imageAnalysisServiceStub.calledOnce).to.be.true;
                expect(updateCurrentWebviewPanelSpy.calledOnceWithExactly('error')).to.be.true;
            });
    });

    test('should fail to read provided filepath', async () => {
        sandbox.stub(fs, 'readFileSync').throws(new Error('Mock Error'));
        const updateCurrentWebviewPanelSpy = sandbox.spy(rhda, 'updateCurrentWebviewPanel');

        await executeDockerImageAnalysis(mockPath, outputChannel)
            .then(() => {
                throw (new Error('should have thrown error'));
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(updateCurrentWebviewPanelSpy.calledOnceWithExactly('error')).to.be.true;
            });
    });
});
