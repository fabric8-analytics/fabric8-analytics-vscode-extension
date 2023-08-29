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
});
