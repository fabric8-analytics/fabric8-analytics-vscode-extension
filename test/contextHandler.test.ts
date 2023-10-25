import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { loadEnvironmentData } from '../src/contextHandler';
import { GlobalState } from '../src/constants';

const expect = chai.expect;
chai.use(sinonChai);

suite('contextHandler Modules', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('setContextData should set environment variables', async () => {

    loadEnvironmentData();

    expect(process.env['VSCEXT_PROVIDE_FULLSTACK_ACTION']).equals('true');
    expect(process.env['VSCEXT_UTM_SOURCE']).equals(GlobalState.UTM_SOURCE);
    expect(process.env['VSCEXT_EXHORT_DEV_MODE']).equals(GlobalState.EXHORT_DEV_MODE);
    expect(process.env['VSCEXT_EXHORT_SNYK_TOKEN']).equals('');
    expect(process.env['VSCEXT_MATCH_MANIFEST_VERSIONS']).equals('true');
    expect(process.env['VSCEXT_EXHORT_MVN_PATH']).equals('mvn');
    expect(process.env['VSCEXT_EXHORT_NPM_PATH']).equals('npm');
    expect(process.env['VSCEXT_EXHORT_GO_PATH']).equals('go');
    expect(process.env['VSCEXT_EXHORT_PYTHON3_PATH']).equals('python3');
    expect(process.env['VSCEXT_EXHORT_PIP3_PATH']).equals('pip3');
    expect(process.env['VSCEXT_EXHORT_PYTHON_PATH']).equals('python');
    expect(process.env['VSCEXT_EXHORT_PIP_PATH']).equals('pip');
  });
});
