import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { CANotification } from '../src/caNotification';

const expect = chai.expect;
chai.use(sinonChai);

suite('CANotification module', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should create an instance with default values when no data is provided', async () => {
        const notification = new CANotification({
            errorMessage: null,
            done: null,
            uri: '',
            diagCount: null,
            vulnCount: null,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('');
        expect(notification.isDone()).to.be.false;
        expect(notification.hasWarning()).to.be.false;
        expect(notification.popupText()).to.equal(' no vulnerabilities found for all the providers combined');
        expect(notification.statusText()).to.equal('$(sync~spin) RHDA analysis in progress');
    });


    test('should create an instance with provided data when CA has been initiated', async () => {
        const notification = new CANotification({
            errorMessage: null,
            done: false,
            uri: 'file:///mock/path',
            diagCount: null,
            vulnCount: null,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.false;
        expect(notification.hasWarning()).to.be.false;
        expect(notification.popupText()).to.equal(' no vulnerabilities found for all the providers combined');
        expect(notification.statusText()).to.equal('$(sync~spin) RHDA analysis in progress');
    });

    test('should create an instance with provided data when CA has completed successfully with one vulnerability from one vulnerability provider', async () => {
        const mockVulnCountMap = new Map<string, number>();
        mockVulnCountMap['snyk'] = 1;
        const notification = new CANotification({
            errorMessage: null,
            done: true,
            uri: 'file:///mock/path',
            diagCount: 1,
            vulnCount: mockVulnCountMap,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.true;
        expect(notification.hasWarning()).to.be.true;
        expect(notification.popupText()).to.equal('Found 1 direct vulnerability for Snyk Provider.');
        expect(notification.statusText()).to.equal('$(warning) 1 direct vulnerability found for all the providers combined');
    });

    test('should create an instance with provided data when CA has completed successfully with many vulnerabilities from one vulnerability provider', async () => {
        const mockVulnCountMap = new Map<string, number>();
        mockVulnCountMap['snyk'] = 3;
        const notification = new CANotification({
            errorMessage: null,
            done: true,
            uri: 'file:///mock/path',
            diagCount: 2,
            vulnCount: mockVulnCountMap,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.true;
        expect(notification.hasWarning()).to.be.true;
        expect(notification.popupText()).to.equal('Found 3 direct vulnerabilities for Snyk Provider.');
        expect(notification.statusText()).to.equal('$(warning) 3 direct vulnerabilities found for all the providers combined');
    });

    test('should create an instance with provided data when CA has completed successfully with vulnerabilities from multiple vulnerability providers', async () => {
        const mockVulnCountMap = new Map<string, number>();
        mockVulnCountMap['snyk'] = 3;
        mockVulnCountMap['oss-index'] = 1;
        const notification = new CANotification({
            errorMessage: null,
            done: true,
            uri: 'file:///mock/path',
            diagCount: 2,
            vulnCount: mockVulnCountMap,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.true;
        expect(notification.hasWarning()).to.be.true;
        expect(notification.popupText()).to.equal('Found 3 direct vulnerabilities for Snyk Provider. Found 1 direct vulnerability for Oss-Index Provider.');
        expect(notification.statusText()).to.equal('$(warning) 4 direct vulnerabilities found for all the providers combined');
    });

    test('should create an instance with provided data when CA has completed successfully with no vulnerabilities', async () => {
        const mockVulnCountMap = new Map<string, number>();
        const notification = new CANotification({
            errorMessage: null,
            done: true,
            uri: 'file:///mock/path',
            diagCount: 0,
            vulnCount: mockVulnCountMap,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.true;
        expect(notification.hasWarning()).to.be.false;
        expect(notification.popupText()).to.equal(' no vulnerabilities found for all the providers combined');
        expect(notification.statusText()).to.equal('$(shield)$(check)');
    });

    test('should create an instance with provided data when CA has completed successfully with diagnostic but no vulnerabilities', async () => {
        const mockVulnCountMap = new Map<string, number>();
        const notification = new CANotification({
            errorMessage: null,
            done: true,
            uri: 'file:///mock/path',
            diagCount: 1,
            vulnCount: mockVulnCountMap,
        });

        expect(notification.errorMsg()).to.equal('');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.true;
        expect(notification.hasWarning()).to.be.true;
        expect(notification.popupText()).to.equal(' no vulnerabilities found for all the providers combined');
        expect(notification.statusText()).to.equal('$(warning) no vulnerabilities found for all the providers combined');
    });

    test('should create an instance with provided data when CA has failed with error', async () => {
        const notification = new CANotification({
            errorMessage: 'Mock error message',
            done: null,
            uri: 'file:///mock/path',
            diagCount: null,
            vulnCount: null,
        });

        expect(notification.errorMsg()).to.equal('Mock error message');
        expect(notification.origin()).to.equal('file:///mock/path');
        expect(notification.isDone()).to.be.false;
        expect(notification.hasWarning()).to.be.false;
        expect(notification.popupText()).to.equal(' no vulnerabilities found for all the providers combined');
        expect(notification.statusText()).to.equal('$(sync~spin) RHDA analysis in progress');
    });
});
