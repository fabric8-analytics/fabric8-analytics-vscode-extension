import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { globalConfig } from '../src/config';
import { validateSnykToken } from '../src/tokenValidation'
import * as exhortServices from '../src/exhortServices'
import { SNYK_URL } from '../src/constants';

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
        globalConfig.telemetryId = 'mockId';
        const options = {
            'RHDA_TOKEN': 'mockId',
            'RHDA_SOURCE': 'vscode',
            'EXHORT_SNYK_TOKEN': 'mockToken'
        };

        const exhortServicesStub = sandbox.stub(exhortServices, 'tokenValidationService');

        await validateSnykToken('mockToken');

        expect(exhortServicesStub.calledOnceWithExactly(options, 'Snyk')).to.be.true;
    });

    test('should validate empty Snyk token', async () => {
        const expectedMsg = `Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, Snyk vulnerabilities will not be displayed. To resolve this issue, please obtain a valid token from the following link: [here](${SNYK_URL}).`;

        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

        await validateSnykToken('');

        const showInformationMessageCall = showInformationMessageStub.getCall(0);
        const showInformationMessageMsg = showInformationMessageCall.args[0];
        expect(showInformationMessageMsg.replace(/\s+/g, ' ').replace(/\n/g, ' ')).to.equal(expectedMsg);
    });
});