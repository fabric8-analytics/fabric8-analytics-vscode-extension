import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { authextension } from '../src/authextension';

const expect = chai.expect;
chai.use(sinonChai);

suite('authextension Modules', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('setContextData should set environment variables based on apiConfig', async () => {
    const mockApiConfig = {
      exhortSnykToken: 'mockToken'
    };

    authextension.setContextData(mockApiConfig);

    expect(process.env['UUISNYK_TOKEND']).equals('mockToken');
    expect(process.env['UTM_SOURCE']).equals('vscode');
    expect(process.env['PROVIDE_FULLSTACK_ACTION']).equals('true');
  });

  test('authorize_f8_analytics should set UUID environment variable and return true', async () => {
    const mockContext = {
      globalState: {
        get: sandbox.stub().returns('mockUUID')
      }
    };

    const result = await authextension.authorize_f8_analytics(mockContext);

    expect(result).to.be.true;
    expect(process.env['UUID']).to.equal('mockUUID');
  });

  test('authorize_f8_analytics should catch and log errors, then return false on failure', async () => {
    const mockError = new Error('Mock error');
    const consoleStub = sandbox.stub(console, 'log');
    sandbox.stub(authextension, 'setTelemetryid').rejects(mockError);
    const mockContext = {};

    const result = await authextension.authorize_f8_analytics(mockContext);

    expect(result).to.be.false;
    expect(consoleStub).to.have.been.calledWith(mockError);
  });
});
