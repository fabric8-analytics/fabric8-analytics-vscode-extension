import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { globalConfig } from '../src/config';
import { GlobalState, SNYK_TOKEN_KEY } from '../src/constants';
import * as commands from '../src/commands';
import * as redhatTelemetry from '../src/redhatTelemetry';
import { context } from './vscontext.mock';

const expect = chai.expect;
chai.use(sinonChai);

suite('Config module', () => {
  let sandbox: sinon.SinonSandbox;

  const mockToken = 'mockToken';
  const mockId = 'mockId';
  const mockedError = new Error('Mock Error Message');

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should initialize Config properties with default extension settings', async () => {

    expect(globalConfig.stackAnalysisCommand).to.eq(commands.STACK_ANALYSIS_COMMAND);
    expect(globalConfig.trackRecommendationAcceptanceCommand).to.eq(commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND);
    expect(globalConfig.utmSource).to.eq(GlobalState.UTM_SOURCE);
    expect(globalConfig.matchManifestVersions).to.eq('true');
    expect(globalConfig.usePythonVirtualEnvironment).to.eq('false');
    expect(globalConfig.useGoMVS).to.eq('false');
    expect(globalConfig.enablePythonBestEffortsInstallation).to.eq('false');
    expect(globalConfig.usePipDepTree).to.eq('false');
    expect(globalConfig.vulnerabilityAlertSeverity).to.eq('Error');
    expect(globalConfig.rhdaReportFilePath).to.eq('/tmp/redhatDependencyAnalyticsReport.html');
    expect(globalConfig.exhortMvnPath).to.eq('mvn');
    expect(globalConfig.exhortGradlePath).to.eq('gradle');
    expect(globalConfig.exhortNpmPath).to.eq('npm');
    expect(globalConfig.exhortGoPath).to.eq('go');
    expect(globalConfig.exhortPython3Path).to.eq('python3');
    expect(globalConfig.exhortPip3Path).to.eq('pip3');
    expect(globalConfig.exhortPythonPath).to.eq('python');
    expect(globalConfig.exhortPipPath).to.eq('pip');
    expect(globalConfig.exhortSyftPath).to.eq('syft');
    expect(globalConfig.exhortSyftConfigPath).to.eq('');
    expect(globalConfig.exhortSkopeoPath).to.eq('skopeo');
    expect(globalConfig.exhortSkopeoConfigPath).to.eq('');
    expect(globalConfig.exhortDockerPath).to.eq('docker');
    expect(globalConfig.exhortPodmanPath).to.eq('podman');
    expect(globalConfig.exhortImagePlatform).to.eq('');
  });

  test('should retrieve telemetry parameters from getTelemetryId and set process environment variables', async () => {
    sandbox.stub(redhatTelemetry, 'getTelemetryId').resolves(mockId);

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => '',
        delete: () => sandbox.stub()
      }
    })

    await globalConfig.authorizeRHDA(context);

    expect(globalConfig.telemetryId).to.equal(mockId);

    expect(process.env['VSCEXT_STACK_ANALYSIS_COMMAND']).to.eq(commands.STACK_ANALYSIS_COMMAND);
    expect(process.env['VSCEXT_TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND']).to.eq(commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND);
    expect(process.env['VSCEXT_UTM_SOURCE']).to.eq(GlobalState.UTM_SOURCE);
    expect(process.env['VSCEXT_MATCH_MANIFEST_VERSIONS']).to.eq('true');
    expect(process.env['VSCEXT_USE_PYTHON_VIRTUAL_ENVIRONMENT']).to.eq('false');
    expect(process.env['VSCEXT_USE_GO_MVS']).to.eq('false');
    expect(process.env['VSCEXT_ENABLE_PYTHON_BEST_EFFORTS_INSTALLATION']).to.eq('false');
    expect(process.env['VSCEXT_USE_PIP_DEP_TREE']).to.eq('false');
    expect(process.env['VSCEXT_VULNERABILITY_ALERT_SEVERITY']).to.eq('Error');
    expect(process.env['VSCEXT_EXHORT_MVN_PATH']).to.eq('mvn');
    expect(process.env['VSCEXT_EXHORT_GRADLE_PATH']).to.eq('gradle');
    expect(process.env['VSCEXT_EXHORT_NPM_PATH']).to.eq('npm');
    expect(process.env['VSCEXT_EXHORT_GO_PATH']).to.eq('go');
    expect(process.env['VSCEXT_EXHORT_PYTHON3_PATH']).to.eq('python3');
    expect(process.env['VSCEXT_EXHORT_PIP3_PATH']).to.eq('pip3');
    expect(process.env['VSCEXT_EXHORT_PYTHON_PATH']).to.eq('python');
    expect(process.env['VSCEXT_EXHORT_PIP_PATH']).to.eq('pip');
    expect(process.env['VSCEXT_TELEMETRY_ID']).to.equal(mockId);
    // expect(process.env['VSCEXT_EXHORT_SNYK_TOKEN']).to.equal('');
    expect(process.env['VSCEXT_EXHORT_SYFT_PATH']).to.equal('syft');
    expect(process.env['VSCEXT_EXHORT_SYFT_CONFIG_PATH']).to.equal('');
    expect(process.env['VSCEXT_EXHORT_SKOPEO_PATH']).to.equal('skopeo');
    expect(process.env['VSCEXT_EXHORT_SKOPEO_CONFIG_PATH']).to.equal('');
    expect(process.env['VSCEXT_EXHORT_DOCKER_PATH']).to.equal('docker');
    expect(process.env['VSCEXT_EXHORT_PODMAN_PATH']).to.equal('podman');
    expect(process.env['VSCEXT_EXHORT_IMAGE_PLATFORM']).to.equal('');
  });

  test('should set Snyk token in VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => '',
        delete: () => sandbox.stub()
      }
    });
    const storeSecretSpy = sandbox.spy(globalConfig.secrets, 'store');
    const showInformationMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
    sandbox.spy(vscode.window, 'showErrorMessage');

    await globalConfig.setSnykToken(mockToken);

    expect(storeSecretSpy).to.have.been.calledWith(SNYK_TOKEN_KEY, mockToken);
    expect(showInformationMessageSpy).to.have.been.calledWith('Snyk token has been saved successfully');
    expect(vscode.window.showErrorMessage).to.not.be.called;
  });

  test('should fail to set Snyk token in VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: async () => {
          throw mockedError;
        },
        get: () => '',
        delete: () => sandbox.stub()
      }
    });
    sandbox.spy(vscode.window, 'showInformationMessage');
    const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage')

    await globalConfig.setSnykToken(mockToken);

    expect(vscode.window.showInformationMessage).to.not.be.called;
    expect(showErrorMessageSpy).to.have.been.calledWith(`Failed to save Snyk token to VSCode Secret Storage, Error: ${mockedError.message}`);
  });

  test('should not set Snyk token in VSCode SecretStorage when token is undefined', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => '',
        delete: () => sandbox.stub()
      }
    });
    sandbox.spy(globalConfig.secrets, 'store');
    sandbox.spy(vscode.window, 'showInformationMessage');
    sandbox.spy(vscode.window, 'showErrorMessage');

    await globalConfig.setSnykToken(undefined);

    expect(globalConfig.secrets.store).to.not.be.called;
    expect(vscode.window.showInformationMessage).to.not.be.called;
    expect(vscode.window.showErrorMessage).to.not.be.called;
  });

  test('should get Snyk token from VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => mockToken,
        delete: () => sandbox.stub()
      }
    });

    expect(await globalConfig.getSnykToken()).to.equal(mockToken);
  });

  test('should get Snyk token from VSCode SecretStorage and return empty string if token is undefined', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => undefined,
        delete: () => sandbox.stub()
      }
    });

    expect(await globalConfig.getSnykToken()).to.equal('');
  });

  test('should fail to get Snyk token from VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: async () => {
          throw mockedError;
        },
        delete: () => sandbox.stub()
      }
    });
    sandbox.spy(globalConfig.secrets, 'delete');
    const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

    expect(await globalConfig.getSnykToken()).to.equal('');

    expect(showErrorMessageSpy).to.have.been.calledWith(`Failed to get Snyk token from VSCode Secret Storage, Error: ${mockedError.message}`);
    expect(globalConfig.secrets.delete).to.be.called;
  });

  test('should fail to get and delete Snyk token from VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: async () => {
          throw mockedError;
        },
        delete: async () => {
          throw mockedError;
        },
      }
    });
    sandbox.spy(globalConfig.secrets, 'delete');
    const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

    expect(await globalConfig.getSnykToken()).to.equal('');

    expect(showErrorMessageSpy).to.have.been.calledWith(`Failed to get Snyk token from VSCode Secret Storage, Error: ${mockedError.message}`);
    expect(globalConfig.secrets.delete).to.be.called;
  });

  test('should delete Snyk token from VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => '',
        delete: () => sandbox.stub()
      }
    });
    const deleteSecretSpy = sandbox.spy(globalConfig.secrets, 'delete');
    const showInformationMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
    sandbox.spy(vscode.window, 'showErrorMessage');

    await globalConfig.clearSnykToken(true);

    expect(deleteSecretSpy).to.have.been.calledWith(SNYK_TOKEN_KEY);
    expect(showInformationMessageSpy).to.have.been.calledWith('Snyk token has been removed successfully');
    expect(vscode.window.showErrorMessage).to.not.be.called;
  });

  test('should fail to delete Snyk token from VSCode SecretStorage', async () => {

    globalConfig.linkToSecretStorage({
      secrets: {
        store: () => sandbox.stub(),
        get: () => '',
        delete: async () => {
          throw mockedError;
        },
      }
    });
    const deleteSecretSpy = sandbox.spy(globalConfig.secrets, 'delete');
    sandbox.spy(vscode.window, 'showInformationMessage');
    const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

    await globalConfig.clearSnykToken(true);

    expect(deleteSecretSpy).to.have.been.calledWith(SNYK_TOKEN_KEY);
    expect(vscode.window.showInformationMessage).to.not.be.called;
    expect(showErrorMessageSpy).to.have.been.calledWith(`Failed to delete Snyk token from VSCode Secret Storage, Error: ${mockedError.message}`);
  });
});
