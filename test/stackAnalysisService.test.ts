import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as request from 'request';
import * as fs from 'fs';

import { context } from './vscontext.mock';
import { stackAnalysisServices } from '../src/stackAnalysisService';
const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis Services', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('context data should have been cleared', () => {
    stackAnalysisServices.clearContextInfo(context);
    expect(context.globalState.get('f8_access_routes')).equals('');
    expect(context.globalState.get('f8_3scale_user_key')).equals('');
  });

  test('exhortApiStackAnalysis should return success with statuscode 200', () => {
    const pathToManifest = 'test/resources/sampleMavenApp/pom.xml';
    const options = {};

    // Mocking the response with an HTML string
    const mockHtmlResponse = fs.readFileSync('test/resources/sampleMavenApp/response.html', 'utf8');
    let stubRequestPost = sandbox
      .stub(request, 'post')
      .yields(null, { statusCode: 200 }, mockHtmlResponse);

    // Call the function being tested
    stackAnalysisServices.exhortApiStackAnalysis(pathToManifest, options, context);

    // Perform assertions
    expect(stubRequestPost).callCount(1);
  });

  test('exhortApiStackAnalysis should return error', () => {
    const pathToManifest = 'test/resources/sampleMavenApp/pom.xml';
    const options = {};
    let spyClearContextInfo = sandbox.spy(
      stackAnalysisServices,
      'clearContextInfo'
    );

    // Mocking an error response
    let stubRequestPost = sandbox.stub(request, 'post').yields('err');

    // Call the function being tested
    stackAnalysisServices.exhortApiStackAnalysis(pathToManifest, options, context);

    // Perform assertions
    expect(stubRequestPost).callCount(1);
    expect(spyClearContextInfo).callCount(1);
  });
});
