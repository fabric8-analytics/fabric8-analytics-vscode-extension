/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';

import * as exhortServices from '../src/exhortServices';
import { globalConfig } from '../src/config';
import { executeDockerImageAnalysis } from '../src/imageAnalysis';
import { parseImageRefFromPurl, AnalysisResponse } from '../src/imageAnalysis/analysis';
import { Uri } from 'vscode';
import * as rhda from '../src/rhda';
import { DepOutputChannel } from '../src/depOutputChannel';
import { MockTokenProvider } from '../src/tokenProvider';

const expect = chai.expect;
chai.use(sinonChai);
const outputChannel = new DepOutputChannel('test');

suite('ImageAnalysis module', async () => {
    let sandbox: sinon.SinonSandbox;
    const mockPath = '/mock/path/to/file';
    const mockReponse = '<html> mockResponse </html>';
    const mockFileContent = `
ARG ARG_IMAGE=alpine
ARG ARG_TAG=latest
FROM --platform=linux/amd64 \${ARG_IMAGE}:\${ARG_TAG} as stage1$ARG_FAKE
FROM ubuntu
FROM scratch
FROM stage1 AS runner
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

        const response = await executeDockerImageAnalysis(new MockTokenProvider(), mockPath, outputChannel);

        expect(imageAnalysisServiceStub.calledOnce).to.be.true;
        expect(response).to.eq(mockReponse);
        expect(updateCurrentWebviewPanelSpy.calledOnceWithExactly(response)).to.be.true;
    });

    test('should fail to generate RHDA report for file', async () => {
        const imageAnalysisServiceStub = sandbox.stub(exhortServices, 'imageAnalysisService').rejects(new Error('Mock Error'));
        sandbox.stub(fs, 'readFileSync').returns(encodedMockFileContent);
        const updateCurrentWebviewPanelSpy = sandbox.spy(rhda, 'updateCurrentWebviewPanel');

        await executeDockerImageAnalysis(new MockTokenProvider(), mockPath, outputChannel)
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

        await executeDockerImageAnalysis(new MockTokenProvider(), mockPath, outputChannel)
            .then(() => {
                throw (new Error('should have thrown error'));
            })
            .catch(error => {
                expect(error.message).to.eq('Mock Error');
                expect(updateCurrentWebviewPanelSpy.calledOnceWithExactly('error')).to.be.true;
            });
    });
});

suite('parseImageRefFromPurl', () => {
    const cases: { input: string; expected: string; description: string }[] = [
        {
            input: 'pkg:docker/nginx@1.25',
            expected: 'nginx',
            description: 'should parse simple image PURL',
        },
        {
            input: 'pkg:docker/library/nginx@1.25',
            expected: 'library/nginx',
            description: 'should parse namespaced image PURL',
        },
        {
            input: 'pkg:docker/registry.example.com:5000/myimage@1.0',
            expected: 'registry.example.com:5000/myimage',
            description: 'should handle registry-qualified PURLs with port colons',
        },
        {
            input: 'pkg:docker/image@sha256:abc123',
            expected: 'image',
            description: 'should handle PURLs with sha256 digest in version',
        },
        {
            input: 'pkg:oci/ubi9/ubi-minimal@9.4',
            expected: 'ubi9/ubi-minimal',
            description: 'should parse OCI-type PURLs',
        },
        {
            input: 'pkg:docker/registry.io:443/org/image@2.0?os=linux',
            expected: 'registry.io:443/org/image',
            description: 'should handle port, namespace, and query params',
        },
        {
            input: 'invalidpurl',
            expected: '',
            description: 'should return empty string for PURL without slash',
        },
    ];

    cases.forEach(({ input, expected, description }) => {
        /** Verifies PURL parsing for: ${description} */
        test(description, () => {
            expect(parseImageRefFromPurl(input)).to.equal(expected);
        });
    });
});

suite('AnalysisResponse provider scoping', () => {
    /**
     * Verifies that hasProviderRecommendations is scoped per-provider, not per-image.
     * When one provider has recommendations and another does not, the provider without
     * recommendations should use the deprecated fallback for its artifacts.
     */
    test('should scope hasProviderRecommendations per-provider so deprecated fallback works for provider without recommendations', () => {
        // Given two providers for the same image:
        // - providerA has recommendations (should suppress deprecated fallback)
        // - providerB has NO recommendations (should use deprecated fallback)
        const mockData = {
            'docker.io/nginx:1.25': {
                providers: {
                    providerA: {
                        status: { ok: true },
                        sources: {
                            sourceA: {
                                summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
                                dependencies: [{
                                    ref: 'pkg:docker/nginx@1.25',
                                    recommendation: 'pkg:docker/nginx@1.26',
                                    issues: [],
                                }],
                            },
                        },
                        recommendations: {
                            'trusted-content': {
                                dependencies: [{
                                    ref: 'pkg:docker/nginx@1.25',
                                    recommendation: 'pkg:docker/ubi9/nginx@1.26',
                                }],
                            },
                        },
                    },
                    providerB: {
                        status: { ok: true },
                        sources: {
                            sourceB: {
                                summary: { total: 1, critical: 0, high: 1, medium: 0, low: 0 },
                                dependencies: [{
                                    ref: 'pkg:docker/nginx@1.25',
                                    recommendation: 'pkg:docker/nginx@1.27',
                                    issues: [{ id: 'CVE-2024-001', severity: 'HIGH' }],
                                }],
                            },
                        },
                        // No recommendations map — should use deprecated fallback
                    },
                },
            },
        };

        // When constructing AnalysisResponse
        const response = new AnalysisResponse(mockData as any, Uri.file('/mock/Dockerfile'));

        // Then the image should have data from both providers
        const imageDataList = response.images.get('docker.io/nginx:1.25');
        expect(imageDataList).to.not.be.undefined;

        // providerA's trusted-content recommendation (from recommendations map)
        const providerARecommendation = imageDataList!.find(
            d => d.sourceId === 'providerA' && d.recommendationSourceId === 'trusted-content'
        );
        expect(providerARecommendation).to.not.be.undefined;
        expect(providerARecommendation!.recommendationRef).to.equal('ubi9/nginx');

        // providerA's artifact should have empty recommendationRef (suppressed by provider recommendations)
        const providerAArtifact = imageDataList!.find(
            d => d.sourceId === 'providerA(sourceA)' && d.recommendationSourceId === ''
        );
        expect(providerAArtifact).to.not.be.undefined;
        expect(providerAArtifact!.recommendationRef).to.equal('');

        // providerB's artifact should use deprecated fallback (non-empty recommendationRef)
        const providerBArtifact = imageDataList!.find(
            d => d.sourceId === 'providerB(sourceB)' && d.recommendationSourceId === ''
        );
        expect(providerBArtifact).to.not.be.undefined;
        expect(providerBArtifact!.recommendationRef).to.equal('nginx');
    });
});
