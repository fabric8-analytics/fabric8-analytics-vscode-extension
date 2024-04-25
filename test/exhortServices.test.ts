import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { rewireModule, cleanupRewireFiles } from './utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('ExhortServices module', async () => {
    let sandbox: sinon.SinonSandbox;

    const compiledFilePath = 'out/src/exhortServices';
    const stackAnalysisReportHtmlMock = '<html>RHDA Report Mock</html>';

    let exhortMock = {
        default: {
            stackAnalysis: async () => stackAnalysisReportHtmlMock,
            validateToken: async (statusCode) => statusCode,
        }
    };

    let exhortServicesRewire;

    setup(async () => {
        sandbox = sinon.createSandbox();
        exhortServicesRewire = await rewireModule(compiledFilePath);
        exhortServicesRewire.__Rewire__('exhort_javascript_api_1', exhortMock);
    });

    teardown(() => {
        sandbox.restore();
        cleanupRewireFiles(compiledFilePath);
    });

    test('should generate RHDA report HTML from Exhort Stack Analysis service', async () => {
        await exhortServicesRewire.stackAnalysisService('mock/path/to/manifest', {})
            .then((result) => {
                expect(result).to.equal(stackAnalysisReportHtmlMock);
            })
    });

    test('should perform token validation with Exhort Validate Token service', async () => {
        sandbox.spy(vscode.window, 'showInformationMessage');

        expect(await exhortServicesRewire.tokenValidationService(200, 'provider')).to.equal(undefined);
        expect(vscode.window.showInformationMessage).to.have.been.calledWith('provider token validated successfully');

        expect(await exhortServicesRewire.tokenValidationService(400, 'provider')).to.equal('Missing token. Please provide a valid provider Token in the extension workspace settings. Status: 400');
        expect(await exhortServicesRewire.tokenValidationService(401, 'provider')).to.equal('Invalid token. Please provide a valid provider Token in the extension workspace settings. Status: 401');
        expect(await exhortServicesRewire.tokenValidationService(403, 'provider')).to.equal('Forbidden. The token does not have permissions. Please provide a valid provider Token in the extension workspace settings. Status: 403');
        expect(await exhortServicesRewire.tokenValidationService(429, 'provider')).to.equal('Too many requests. Rate limit exceeded. Please try again in a little while. Status: 429');
        expect(await exhortServicesRewire.tokenValidationService(500, 'provider')).to.equal('Failed to validate token. Status: 500');
    });

    test('should fail to generate RHDA report HTML from Exhort Stack Analysis service and reject with error', async () => {

        let exhortMock = {
            default: {
                stackAnalysis: async () => {
                    throw new Error('Analysis Error');
                },
            }
        };

        exhortServicesRewire.__Rewire__('exhort_javascript_api_1', exhortMock);

        await exhortServicesRewire.stackAnalysisService('mock/path/to/manifest', {})
            .then(() => {
                throw new Error('should have thrown Analysis Error')
            })
            .catch((error) => {
                expect(error.message).to.equal('Analysis Error');
            })
    });

    test('should fail to perform token validation with Exhort Validate Token service and display error message', async () => {

        let exhortMock = {
            default: {
                validateToken: async () => {
                    throw new Error('Validation Error');
                },
            }
        };

        exhortServicesRewire.__Rewire__('exhort_javascript_api_1', exhortMock);

        expect(await exhortServicesRewire.tokenValidationService(500, 'provider')).to.equal('Failed to validate token, Error: Validation Error');
    });
});