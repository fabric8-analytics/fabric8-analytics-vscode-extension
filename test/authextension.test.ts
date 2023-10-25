import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { authextension } from '../src/authextension';
import { GlobalState } from '../src/constants';

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

  test('setContextData should set environment variables', async () => {
    const mockApiConfig = {
      exhortSnykToken: 'mockToken',
      matchManifestVersions: true,
    };

    authextension.setContextData(mockApiConfig);

    expect(process.env['PROVIDE_FULLSTACK_ACTION']).equals('true');
    expect(process.env['UTM_SOURCE']).equals('vscode');
    expect(process.env['SNYK_TOKEN']).equals('mockToken');
    expect(process.env['MATCH_MANIFEST_VERSIONS']).equals('true');
    expect(process.env['MVN_EXECUTABLE']).equals('mvn');
    expect(process.env['NPM_EXECUTABLE']).equals('npm');
    expect(process.env['GO_EXECUTABLE']).equals('go');
    expect(process.env['PYTHON3_EXECUTABLE']).equals('python3');
    expect(process.env['PIP3_EXECUTABLE']).equals('pip3');
    expect(process.env['PYTHON_EXECUTABLE']).equals('python');
    expect(process.env['PIP_EXECUTABLE']).equals('pip');
    expect(process.env['EXHORT_DEV_MODE']).equals(GlobalState.ExhortDevMode);
  });
});
