/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { rewireModule, cleanupRewireFiles } from './utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('RedhatTelemetry module', async () => {
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    const compiledFilePath = 'out/src/redhatTelemetry';
    const redHatUUIDMock = 'Mock UUID';

    const getRedHatUUIDMock = {
        getRedHatUUID: async () => redHatUUIDMock
    };

    const sendEventMock = {
        sendStartupEvent: sandbox.spy(),
        send: sandbox.spy()
    };

    const getIdProviderMock = {
        getIdProvider: async () => getRedHatUUIDMock,
        getTelemetryService: async () => sendEventMock
    };

    const getRedHatServiceMock = {
        getRedHatService: async () => getIdProviderMock
    };

    let redhatTelemetryRewire: any;

    setup(async () => {
        redhatTelemetryRewire = await rewireModule(compiledFilePath);
        redhatTelemetryRewire.__Rewire__('vscode_redhat_telemetry_1', getRedHatServiceMock);
    });

    teardown(() => {
        sandbox.restore();
        cleanupRewireFiles(compiledFilePath);
    });

    test('should get UUID from vscode redhat telemetry service', async () => {
        const telemetryId = await redhatTelemetryRewire.getTelemetryId({});
        expect(telemetryId).to.equal(redHatUUIDMock);
    });

    test('should send statup telemetry event', async () => {
        await redhatTelemetryRewire.startUp({});
        expect(sendEventMock.sendStartupEvent).to.have.been.calledOnce;
    });

    test('should record telemetry event', async () => {
        await redhatTelemetryRewire.record({}, 'telemetry_event_mock', { mockProp: 'mockValue' });
        expect(sendEventMock.send).to.have.been.calledWith({
            type: 'track',
            name: 'telemetry_event_mock',
            properties: { mockProp: 'mockValue' }
        });
    });
});