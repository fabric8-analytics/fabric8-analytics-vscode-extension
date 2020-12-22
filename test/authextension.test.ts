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

  test('call to setContextData should set env variables', async () => {
    const apiRoutes = { host: 'http://prod', apikey: '12345' };
    authextension.setContextData(apiRoutes);
  });

  test('call to setUUID should set env variable', async () => {
    const uuid = "a1b2c3d4";
    authextension.setUUID(uuid);
    expect(process.env['UUID']).equals('a1b2c3d4');
  });
});
