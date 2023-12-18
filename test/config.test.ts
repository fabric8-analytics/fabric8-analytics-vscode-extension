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

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should initialize Config properties with default extension workspace settings', async () => {

    expect(globalConfig.triggerFullStackAnalysis).to.eq(commands.TRIGGER_FULL_STACK_ANALYSIS);
    expect(globalConfig.triggerRHRepositoryRecommendationNotification).to.eq(commands.TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION);
    expect(globalConfig.utmSource).to.eq(GlobalState.UTM_SOURCE);
    expect(globalConfig.exhortSnykToken).to.eq('');
    expect(globalConfig.matchManifestVersions).to.eq('true');
    expect(globalConfig.rhdaReportFilePath).to.eq('/tmp/redhatDependencyAnalyticsReport.html');
    expect(globalConfig.exhortMvnPath).to.eq('mvn');
    expect(globalConfig.exhortNpmPath).to.eq('npm');
    expect(globalConfig.exhortGoPath).to.eq('go');
    expect(globalConfig.exhortPython3Path).to.eq('python3');
    expect(globalConfig.exhortPip3Path).to.eq('pip3');
    expect(globalConfig.exhortPythonPath).to.eq('python');
    expect(globalConfig.exhortPipPath).to.eq('pip');

    expect(process.env['VSCEXT_TRIGGER_FULL_STACK_ANALYSIS']).to.eq(commands.TRIGGER_FULL_STACK_ANALYSIS);
    expect(process.env['VSCEXT_TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION']).to.eq(commands.TRIGGER_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION);
    expect(process.env['VSCEXT_UTM_SOURCE']).to.eq(GlobalState.UTM_SOURCE);
    expect(process.env['VSCEXT_EXHORT_SNYK_TOKEN']).to.eq('');
    expect(process.env['VSCEXT_MATCH_MANIFEST_VERSIONS']).to.eq('true');
    expect(process.env['VSCEXT_EXHORT_MVN_PATH']).to.eq('mvn');
    expect(process.env['VSCEXT_EXHORT_NPM_PATH']).to.eq('npm');
    expect(process.env['VSCEXT_EXHORT_GO_PATH']).to.eq('go');
    expect(process.env['VSCEXT_EXHORT_PYTHON3_PATH']).to.eq('python3');
    expect(process.env['VSCEXT_EXHORT_PIP3_PATH']).to.eq('pip3');
    expect(process.env['VSCEXT_EXHORT_PYTHON_PATH']).to.eq('python');
    expect(process.env['VSCEXT_EXHORT_PIP_PATH']).to.eq('pip');
  });

  test('should call retrieve telemetry parameters from getTelemetryId', async () => {
    sandbox.stub(redhatTelemetry, 'getTelemetryId').resolves('mockId');

    await globalConfig.authorizeRHDA(context);

    expect(globalConfig.telemetryId).to.equal('mockId');
    expect(process.env['VSCEXT_TELEMETRY_ID']).to.equal('mockId');
  });
});
