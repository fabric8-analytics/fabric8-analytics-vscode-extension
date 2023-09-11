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
    getConfigurationStub.withArgs('redHatDependencyAnalytics').resolves('mockApiConfig');

    const apiConfig = await Config.getApiConfig();

    expect(apiConfig).to.equal('mockApiConfig');
  });

  test('getMvnExecutable should get mvn executable', () => {
    let mvnPath = Config.getMvnExecutable();

    expect(mvnPath).equals('mvn');
  });

  test('getNpmExecutable should get npm executable', () => {
    let npmPath = Config.getNpmExecutable();

    expect(npmPath).equals('npm');
  });

  test('getGoExecutable should get go executable', () => {
    let goPath = Config.getGoExecutable();

    expect(goPath).equals('go');
  });
});
