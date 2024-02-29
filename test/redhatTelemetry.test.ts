import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { rewireModule, cleanupRewireFiles } from './utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('RedhatTelemetry module', async () => {
    let sandbox: sinon.SinonSandbox;

    const compiledFilePath = 'out/src/redhatTelemetry';
    const redHatUUIDMock = 'Mock UUID';

    let getRedHatUUIDMock = {
        getRedHatUUID: async () => redHatUUIDMock
    }

    let sendEventMock = {
        sendStartupEvent: sandbox.spy(),
        send: sandbox.spy()
    }

    let getIdProviderMock = {
        getIdProvider: async () => getRedHatUUIDMock,
        getTelemetryService: async () => sendEventMock
    }

    let getRedHatServiceMock = {
        getRedHatService: async () => getIdProviderMock
    };

    let redhatTelemetryRewire;

    setup(async () => {
        sandbox = sinon.createSandbox();
        redhatTelemetryRewire = await rewireModule(compiledFilePath);
        redhatTelemetryRewire.__Rewire__('vscode_redhat_telemetry_1', getRedHatServiceMock);
    });

    teardown(() => {
        sandbox.restore();
        cleanupRewireFiles(compiledFilePath);
    });

    test('should get UUID from vscode redhat telemetry service', async () => {
        let telemetryId = await redhatTelemetryRewire.getTelemetryId({})
        expect(telemetryId).to.equal(redHatUUIDMock);
    });

    test('should send statup telemetry event', async () => {
        await redhatTelemetryRewire.startUp({})
        expect(sendEventMock.sendStartupEvent).to.have.been.calledOnce;
    });

    test('should record telemetry event', async () => {
        await redhatTelemetryRewire.record({}, 'telemetry_event_mock', { mockProp: 'mockValue' })
        expect(sendEventMock.send).to.have.been.calledWith({
            type: 'track',
            name: 'telemetry_event_mock',
            properties: { mockProp: 'mockValue' }
        });
    });
});