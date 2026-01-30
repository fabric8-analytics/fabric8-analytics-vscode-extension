/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { globalConfig } from '../src/config';
import { GlobalState } from '../src/constants';
import * as commands from '../src/commands';
import * as redhatTelemetry from '../src/redhatTelemetry';
import { context } from './vscontext.mock';

const expect = chai.expect;
chai.use(sinonChai);

suite('Config module', () => {
  let sandbox: sinon.SinonSandbox;

  const mockId = 'mockId';

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
    expect(globalConfig.exhortProxyUrl).to.eq('');
    expect(globalConfig.matchManifestVersions).to.eq('true');
    expect(globalConfig.usePythonVirtualEnvironment).to.eq('false');
    expect(globalConfig.useGoMVS).to.eq('true');
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
        onDidChange: sandbox.stub(),
        store: () => sandbox.stub() as any,
        get: async () => '',
        delete: () => sandbox.stub() as any
      }
    });

    await globalConfig.authorizeRHDA(context);

    expect(globalConfig.telemetryId).to.equal(mockId);

    expect(process.env['VSCEXT_STACK_ANALYSIS_COMMAND']).to.eq(commands.STACK_ANALYSIS_COMMAND);
    expect(process.env['VSCEXT_TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND']).to.eq(commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND);
    expect(process.env['VSCEXT_UTM_SOURCE']).to.eq(GlobalState.UTM_SOURCE);
    expect(process.env['VSCEXT_PROXY_URL']).to.eq('');
    expect(process.env['VSCEXT_MATCH_MANIFEST_VERSIONS']).to.eq('true');
    expect(process.env['VSCEXT_USE_PYTHON_VIRTUAL_ENVIRONMENT']).to.eq('false');
    expect(process.env['VSCEXT_USE_GO_MVS']).to.eq('true');
    expect(process.env['VSCEXT_ENABLE_PYTHON_BEST_EFFORTS_INSTALLATION']).to.eq('false');
    expect(process.env['VSCEXT_USE_PIP_DEP_TREE']).to.eq('false');
    expect(process.env['VSCEXT_VULNERABILITY_ALERT_SEVERITY']).to.eq('Error');
    expect(process.env['VSCEXT_TRUSTIFY_DA_MVN_PATH']).to.eq('mvn');
    expect(process.env['VSCEXT_TRUSTIFY_DA_GRADLE_PATH']).to.eq('gradle');
    expect(process.env['VSCEXT_TRUSTIFY_DA_NPM_PATH']).to.eq('npm');
    expect(process.env['VSCEXT_TRUSTIFY_DA_GO_PATH']).to.eq('go');
    expect(process.env['VSCEXT_TRUSTIFY_DA_PYTHON3_PATH']).to.eq('python3');
    expect(process.env['VSCEXT_TRUSTIFY_DA_PIP3_PATH']).to.eq('pip3');
    expect(process.env['VSCEXT_TRUSTIFY_DA_PYTHON_PATH']).to.eq('python');
    expect(process.env['VSCEXT_TRUSTIFY_DA_PIP_PATH']).to.eq('pip');
    expect(process.env['VSCEXT_TELEMETRY_ID']).to.equal(mockId);
    expect(process.env['VSCEXT_TRUSTIFY_DA_SYFT_PATH']).to.equal('syft');
    expect(process.env['VSCEXT_TRUSTIFY_DA_SYFT_CONFIG_PATH']).to.equal('');
    expect(process.env['VSCEXT_TRUSTIFY_DA_SKOPEO_PATH']).to.equal('skopeo');
    expect(process.env['VSCEXT_TRUSTIFY_DA_SKOPEO_CONFIG_PATH']).to.equal('');
    expect(process.env['VSCEXT_TRUSTIFY_DA_DOCKER_PATH']).to.equal('docker');
    expect(process.env['VSCEXT_TRUSTIFY_DA_PODMAN_PATH']).to.equal('podman');
    expect(process.env['VSCEXT_TRUSTIFY_DA_IMAGE_PLATFORM']).to.equal('');
  });
}).beforeEach(() => {
  globalConfig.loadData();
});
