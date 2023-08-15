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

  test('should get API config', () => {
    const workspaceConfiguration = {
      get: function (section: string) {
        // Return a mock API configuration here
        if (section === 'dependencyAnalytics') {
          return { mockApiConfig: true };
        }
        throw new Error('Unknown section');
      },
    };
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(workspaceConfiguration as vscode.WorkspaceConfiguration);

    const apiConfig = Config.getApiConfig();

    expect(apiConfig).to.deep.equal({ mockApiConfig: true });
  });

  test('should get Maven executable', () => {
    let mavenPath = Config.getMavenExecutable();

    expect(mavenPath).equals('mvn');
  });

  test('should get Node executable', () => {
    let npmPath = Config.getNodeExecutable();

    expect(npmPath).equals('npm');
  });

  test('should get Python executable', () => {
    let python = Config.getPythonExecutable();

    expect(python).equals('python');
  });

  test('should get Go executable', () => {
    let goPath = Config.getGoExecutable();

    expect(goPath).equals('go');
  });
});
