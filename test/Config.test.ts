import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Config } from '../src/Config';

const expect = chai.expect;
chai.use(sinonChai);

suite('Config module', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getMavenExecutable should return mvn', () => {
    let mavenPath = Config.getMavenExecutable();
    expect(mavenPath).equals('mvn');
  });

  test('getNodeExecutable should return npm', () => {
    let npmPath = Config.getNodeExecutable();
    expect(npmPath).equals('npm');
  });

  test('getPypiExecutable should return python', () => {
    let pypiPath = Config.getPypiExecutable();
    expect(pypiPath).equals('python');
  });
});
