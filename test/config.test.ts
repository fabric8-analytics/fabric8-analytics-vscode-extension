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

  test('should initialize Config properties with default extension settings', async () => {

    expect(globalConfig.stackAnalysisCommand).to.eq(commands.STACK_ANALYSIS_COMMAND);
    expect(globalConfig.rhRepositoryRecommendationNotificationCommand).to.eq(commands.REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION_COMMAND);
    expect(globalConfig.utmSource).to.eq(GlobalState.UTM_SOURCE);
    expect(globalConfig.matchManifestVersions).to.eq('true');
    expect(globalConfig.vulnerabilityAlertSeverity).to.eq('Error');
    expect(globalConfig.rhdaReportFilePath).to.eq('/tmp/redhatDependencyAnalyticsReport.html');
    expect(globalConfig.exhortMvnPath).to.eq('mvn');
    expect(globalConfig.exhortNpmPath).to.eq('npm');
    expect(globalConfig.exhortGoPath).to.eq('go');
    expect(globalConfig.exhortPython3Path).to.eq('python3');
    expect(globalConfig.exhortPip3Path).to.eq('pip3');
    expect(globalConfig.exhortPythonPath).to.eq('python');
    expect(globalConfig.exhortPipPath).to.eq('pip');

    expect(process.env['VSCEXT_STACK_ANALYSIS_COMMAND']).to.eq(commands.STACK_ANALYSIS_COMMAND);
    expect(process.env['VSCEXT_REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION_COMMAND']).to.eq(commands.REDHAT_REPOSITORY_RECOMMENDATION_NOTIFICATION_COMMAND);
    expect(process.env['VSCEXT_UTM_SOURCE']).to.eq(GlobalState.UTM_SOURCE);
    expect(process.env['VSCEXT_EXHORT_SNYK_TOKEN']).to.eq('');
    expect(process.env['VSCEXT_MATCH_MANIFEST_VERSIONS']).to.eq('true');
    expect(process.env['VSCEXT_VULNERABILITY_ALERT_SEVERITY']).to.eq('Error');
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
