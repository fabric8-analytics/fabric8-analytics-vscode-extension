import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Utils } from '../src/Utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('Utils module', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getMavenExecutable should return mvn', () => {
    let mavenPath = Utils.getMavenExecutable();
    expect(mavenPath).equals('mvn');
  });

  test('getNodeExecutable should return npm', () => {
    let npmPath = Utils.getNodeExecutable();
    expect(npmPath).equals('npm');
  });

  test('getPypiExecutable should return python', () => {
    let pypiPath = Utils.getPypiExecutable();
    expect(pypiPath).equals('python');
  });
});
