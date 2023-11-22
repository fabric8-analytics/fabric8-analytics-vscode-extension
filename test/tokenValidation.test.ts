import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { globalConfig } from '../src/config';
import { validateSnykToken, validateOSSIndexToken } from '../src/tokenValidation'
import * as exhortServices from '../src/exhortServices'
import { snykURL, ossIndexURL } from '../src/constants';

const expect = chai.expect;
chai.use(sinonChai);

suite('TokenValidation module', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should validate non-empty Snyk token', async () => {
        globalConfig.exhortSnykToken = 'mockToken';
        globalConfig.telemetryId = 'mockId';
        const options = {
            'RHDA_TOKEN': 'mockId',
            'RHDA_SOURCE': 'vscode',
            'EXHORT_SNYK_TOKEN': 'mockToken'
        };

        const exhortServicesStub = sandbox.stub(exhortServices, 'tokenValidationService');

        await validateSnykToken();

        expect(exhortServicesStub.calledOnceWithExactly(options, 'Snyk')).to.be.true;
    });

    test('should validate empty Snyk token', async () => {
        globalConfig.exhortSnykToken = '';
        const expectedMsg = `Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, Snyk vulnerabilities will not be displayed. To resolve this issue, please obtain a valid token from the following link: [here](${snykURL}).`;

        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

        await validateSnykToken();

        const showInformationMessageCall = showInformationMessageStub.getCall(0);
        const showInformationMessageMsg = showInformationMessageCall.args[0];
        expect(showInformationMessageMsg.replace(/\s+/g, ' ').replace(/\n/g, ' ')).to.equal(expectedMsg);
    });

    test('should validate non-empty OSS Index token and user', async () => {
        globalConfig.exhortOSSIndexUser = 'mockUser';
        globalConfig.exhortOSSIndexToken = 'mockToken';
        globalConfig.telemetryId = 'mockId';
        const options = {
            'RHDA_TOKEN': 'mockId',
            'RHDA_SOURCE': 'vscode',
            'EXHORT_OSS_INDEX_USER': 'mockUser',
            'EXHORT_OSS_INDEX_TOKEN': 'mockToken'
        };

        const exhortServicesStub = sandbox.stub(exhortServices, 'tokenValidationService');

        await validateOSSIndexToken();

        expect(exhortServicesStub.calledOnceWithExactly(options, 'OSS Index')).to.be.true;
    });

    test('should validate empty OSS Index token and user', async () => {
        globalConfig.exhortOSSIndexUser = '';
        globalConfig.exhortOSSIndexToken = '';
        const expectedMsg = `OSS Index username and token have not been provided. Please note that if you fail to provide valid OSS Index credentials in the extension workspace settings, OSS Index vulnerabilities will not be displayed. To resolve this issue, please register and obtain valid credentials from the following link: [here](${ossIndexURL}).`
        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

        await validateOSSIndexToken();

        const showInformationMessageCall = showInformationMessageStub.getCall(0);
        const showInformationMessageMsg = showInformationMessageCall.args[0];
        expect(showInformationMessageMsg.replace(/\s+/g, ' ').replace(/\n/g, ' ')).to.equal(expectedMsg);
    });

    test('should validate empty OSS Index token and non-empty user', async () => {
        globalConfig.exhortOSSIndexUser = 'mockUser';
        globalConfig.exhortOSSIndexToken = '';
        const expectedMsg = `OSS Index token has not been provided. Please note that if you fail to provide valid OSS Index credentials in the extension workspace settings, OSS Index vulnerabilities will not be displayed. To resolve this issue, please register and obtain valid credentials from the following link: [here](${ossIndexURL}).`
        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

        await validateOSSIndexToken();

        const showInformationMessageCall = showInformationMessageStub.getCall(0);
        const showInformationMessageMsg = showInformationMessageCall.args[0];
        expect(showInformationMessageMsg.replace(/\s+/g, ' ').replace(/\n/g, ' ')).to.equal(expectedMsg);
    });

    test('should validate non-empty OSS Index token and empty user', async () => {
        globalConfig.exhortOSSIndexUser = '';
        globalConfig.exhortOSSIndexToken = 'mockToken';
        const expectedMsg = `OSS Index username has not been provided. Please note that if you fail to provide valid OSS Index credentials in the extension workspace settings, OSS Index vulnerabilities will not be displayed. To resolve this issue, please register and obtain valid credentials from the following link: [here](${ossIndexURL}).`
        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

        await validateOSSIndexToken();

        const showInformationMessageCall = showInformationMessageStub.getCall(0);
        const showInformationMessageMsg = showInformationMessageCall.args[0];
        expect(showInformationMessageMsg.replace(/\s+/g, ' ').replace(/\n/g, ' ')).to.equal(expectedMsg);
    });
});