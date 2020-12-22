import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { context } from './vscontext.mock';
import { authextension } from '../src/authextension';
import { stackAnalysisServices } from '../src/stackAnalysisService';

const expect = chai.expect;
chai.use(sinonChai);

suite('authextension Modules', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('call to setContextData should set env variables', async () => {
    const context_f8_access_routes = { prod: 'http://prod' };
    const context_f8_3scale_user_key = '12345';
    authextension.setContextData(
      context_f8_access_routes,
      context_f8_3scale_user_key
    );
    expect(process.env['RECOMMENDER_API_URL']).equals('http://prod/api/v2');
    expect(process.env['THREE_SCALE_USER_TOKEN']).equals('12345');
  });

  test('call to setUUID should set env variable', async () => {
    const uuid = "a1b2c3d4";
    authextension.setUUID(uuid);
    expect(process.env['UUID']).equals('a1b2c3d4');
  });

  test('authorize_f8_analytics should call get_3scale_routes and return err', async () => {
    context.globalState.update('f8_access_routes', '');
    context.globalState.update('f8_3scale_user_key', '');
    let stubGet_3scale_routes = sandbox
      .stub(authextension, 'get_3scale_routes')
      .rejects(false);
    let promiseAuthf8Analytics = await authextension.authorize_f8_analytics(
      context
    );
    expect(promiseAuthf8Analytics).equals(false);
    expect(stubGet_3scale_routes).callCount(1);
  });

  test('get_3scale_routes should return success', async () => {
    context.globalState.update('f8_access_routes', '');
    context.globalState.update('f8_3scale_user_key', '');
    let stubGet3ScaleRouteService = sandbox
      .stub(stackAnalysisServices, 'get3ScaleRouteService')
      .resolves({
        endpoints: { prod: 'http://prod/api/v2' },
        user_key: '12345'
      });
    let promiseGet3scaleRoutes = await authextension.get_3scale_routes(context);
    expect(promiseGet3scaleRoutes).equals(true);
    expect(stubGet3ScaleRouteService).callCount(1);
  });

  test('get_3scale_routes should return err', async () => {
    let savedErr: any;
    context.globalState.update('f8_access_routes', '');
    context.globalState.update('f8_3scale_user_key', '');
    let stubGet3ScaleRouteService = sandbox
      .stub(stackAnalysisServices, 'get3ScaleRouteService')
      .rejects(null);
    try {
      await authextension.get_3scale_routes(context);
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedErr).equals(null);
    expect(stubGet3ScaleRouteService).callCount(1);
  });
});
