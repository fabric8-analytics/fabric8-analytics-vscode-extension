import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import { stackAnalysisServices } from '../src/stackAnalysisService';
import exhort from '@RHEcosystemAppEng/exhort-javascript-api';


const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis Services', () => {
  let sandbox: sinon.SinonSandbox;
  const options = {};

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('exhortApiStackAnalysis should return HTML', async () => {
    const pathToManifest = 'sampleMavenApp/pom.xml';

    const result = await stackAnalysisServices.exhortApiStackAnalysis(pathToManifest, options, context);

    // Compare the result with the mocked response
    const mockHtmlResponse = fs.readFileSync('sampleMavenApp/response.html', 'utf8');
    expect(result).to.equal(mockHtmlResponse);
  });

  test('exhortApiStackAnalysis should return error', async () => {
    const pathToManifest = '/path/to/mock/pom.xml';
    sandbox.stub(exhort, 'stackAnalysis').rejects(new Error('Mock error message'));
    expect(await stackAnalysisServices.exhortApiStackAnalysis(pathToManifest, options, context)).to.throw(new Error('Mock error message'));

  });

  test('getSnykTokenValidationService should show Snyk Token Validated message on 200 status code', async () => {
    const showInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
    sandbox.stub(exhort, 'validateToken').resolves(200);

    await stackAnalysisServices.getSnykTokenValidationService(options);

    expect(showInformationMessage).to.be.calledWith('Snyk Token Validated Successfully');
  });

  test('getSnykTokenValidationService should show appropriate warning message on non-200 status code', async () => {
    const showWarningMessage = sandbox.stub(vscode.window, 'showWarningMessage');

    const statusCodes = [400, 401, 403, 429];
    for (const statusCode of statusCodes) {
      sandbox.stub(exhort, 'validateToken').resolves(statusCode);

      await stackAnalysisServices.getSnykTokenValidationService(options);

      expect(showWarningMessage).to.be.calledWith(sandbox.match(new RegExp(`^.*Status: ${statusCode}$`)));
    }

    // Additional test for an unknown status code
    sandbox.stub(exhort, 'validateToken').resolves(500);

    await stackAnalysisServices.getSnykTokenValidationService(options);

    expect(showWarningMessage).to.be.calledWith('Failed to validate token. Status: 500');
  });

  test('getSnykTokenValidationService should handle error', async () => {
    sandbox.stub(exhort, 'validateToken').rejects(new Error('Mock error message'));

    expect(await stackAnalysisServices.getSnykTokenValidationService(options)).to.throw(new Error('Mock error message'));
  });
});
