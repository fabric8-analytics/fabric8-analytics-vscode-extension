import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as vscode from 'vscode';
import * as Config from '../src/config';

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

  test('getMvnExecutable should get default mvn executable', () => {
    let mvnPath = Config.getMvnExecutable();

    expect(mvnPath).equals('mvn');
  });

  test('getMvnExecutable should get custom mvn executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/mvn';
        }
      },
    };
    getConfigurationStub.withArgs('mvn.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let mvnPath = Config.getMvnExecutable();

    expect(mvnPath).equals('path/to/mvn');
  });

  test('getNpmExecutable should get default npm executable', () => {
    let npmPath = Config.getNpmExecutable();

    expect(npmPath).equals('npm');
  });

  test('getNpmExecutable should get custom npm executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/npm';
        }
      },
    };
    getConfigurationStub.withArgs('npm.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let npmPath = Config.getNpmExecutable();

    expect(npmPath).equals('path/to/npm');
  });

  test('getGoExecutable should get default go executable', () => {
    let goPath = Config.getGoExecutable();

    expect(goPath).equals('go');
  });

  test('getGoExecutable should get custom go executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/go';
        }
      },
    };
    getConfigurationStub.withArgs('go.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let goPath = Config.getGoExecutable();

    expect(goPath).equals('path/to/go');
  });

  test('getPython3Executable should get default python3 executable', () => {
    let python3Path = Config.getPython3Executable();

    expect(python3Path).equals('python3');
  });

  test('getPython3Executable should get custom python3 executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/python3';
        }
      },
    };
    getConfigurationStub.withArgs('python3.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let python3Path = Config.getPython3Executable();

    expect(python3Path).equals('path/to/python3');
  });

  test('getPip3Executable should get default pip3 executable', () => {
    let pip3Path = Config.getPip3Executable();

    expect(pip3Path).equals('pip3');
  });

  test('getPip3Executable should get custom pip3 executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/pip3';
        }
      },
    };
    getConfigurationStub.withArgs('pip3.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let pip3Path = Config.getPip3Executable();

    expect(pip3Path).equals('path/to/pip3');
  });

  test('getPythonExecutable should get default python executable', () => {
    let pythonPath = Config.getPythonExecutable();

    expect(pythonPath).equals('python');
  });

  test('getPythonExecutable should get custom python executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/python';
        }
      },
    };
    getConfigurationStub.withArgs('python.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let pythonPath = Config.getPythonExecutable();

    expect(pythonPath).equals('path/to/python');
  });

  test('getPipExecutable should get default pip executable', () => {
    let pipPath = Config.getPipExecutable();

    expect(pipPath).equals('pip');
  });

  test('getPipExecutable should get custom pip executable', () => {
    const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    const configMock = {
      get: (key: string) => {
        if (key === 'path') {
          return 'path/to/pip';
        }
      },
    };
    getConfigurationStub.withArgs('pip.executable').returns(configMock as vscode.WorkspaceConfiguration);

    let pipPath = Config.getPipExecutable();

    expect(pipPath).equals('path/to/pip');
  });
});
