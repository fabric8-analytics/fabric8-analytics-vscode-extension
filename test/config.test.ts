import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as vscode from 'vscode';
import { Config } from '../src/config';

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

  test('getApiConfig should get API config', async () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    getConfigurationStub.withArgs('dependencyAnalytics').resolves('mockApiConfig');

    const apiConfig = await Config.getApiConfig();

    expect(apiConfig).to.equal('mockApiConfig');
  });

  test('getMavenExecutable should get Maven executable', () => {
    let mavenPath = Config.getMavenExecutable();

    expect(mavenPath).equals('mvn');
  });

  test('getNodeExecutable should get Node executable', () => {
    let npmPath = Config.getNodeExecutable();

    expect(npmPath).equals('npm');
  });

  test('getPythonExecutable should get Python executable', () => {
    let python = Config.getPythonExecutable();

    expect(python).equals('python');
  });

  test('getGoExecutable should get Go executable', () => {
    let goPath = Config.getGoExecutable();

    expect(goPath).equals('go');
  });
});
