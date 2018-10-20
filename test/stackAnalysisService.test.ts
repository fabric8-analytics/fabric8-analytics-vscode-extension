import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import { stackAnalysisServices } from '../src/stackAnalysisService';

const request = require('request');

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis Services', () => {

    let sandbox: sinon.SinonSandbox;
    let dummyMomentoData = {};
    
    class DummyMemento implements vscode.Memento {
        get<T>(key: string): Promise<T|undefined> {
          return dummyMomentoData[key];
        }
        update(key: string, value: any): Promise<any> {
            dummyMomentoData[key] = value;
            return Promise.resolve(dummyMomentoData);
        }
    }

    const context: vscode.ExtensionContext = {
        extensionPath: 'path',
        storagePath: 'string',
        subscriptions: { dispose(): any {} }[0],
        workspaceState: new DummyMemento(),
        globalState: new DummyMemento(),
        asAbsolutePath(relativePath: string): string {
            return '';
        }
    };

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

    test('getStackAnalysisService should return success with statuscode 200', () => {
        const options = {};
        let sampleBody = {'result': 'sucess'};
        options['uri'] = 'https://abc.com';
        let stubRequestGet = sandbox.stub(request, 'get').yields(null, {'statusCode':200}, JSON.stringify(sampleBody));
        stackAnalysisServices.getStackAnalysisService(options);
        expect(stubRequestGet).calledOnce;
    });

    test('getStackAnalysisService should return success with statuscode 403', () => {
        const options = {};
        let sampleBody = {'result': 'sucess'};
        options['uri'] = 'https://abc.com';
        let stubRequestGet = sandbox.stub(request, 'get').yields(null, {'statusCode':403}, JSON.stringify(sampleBody));
        stackAnalysisServices.getStackAnalysisService(options);
        expect(stubRequestGet).calledOnce;
    });

    test('postStackAnalysisService should return success with statuscode 200', () => {
        const options = {};
        let sampleBody = {'id': '12345','status':'success'};
        options['uri'] = 'https://abc.com';
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':200}, JSON.stringify(sampleBody));
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
    });

    test('postStackAnalysisService should return success with error and statuscode 200 ', () => {
        const options = {};
        let sampleBody = { 'error': 'Could not process aa76ab88de4d444896e1969360f628bf.'};
        options['uri'] = 'https://abc.com';
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':200}, JSON.stringify(sampleBody));
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
    });

    test('postStackAnalysisService should return success with statuscode 401', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':401});
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
    });

    test('postStackAnalysisService should return success with statuscode 429', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':429});
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
    });

    test('postStackAnalysisService should return success with statuscode 400', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':400});
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
    });

    test('postStackAnalysisService should return success with statuscode 500 and call ClearContextInfo', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let spyClearContextInfo = sandbox.stub(stackAnalysisServices, 'clearContextInfo');
        let stubRequestPost = sandbox.stub(request, 'post').yields(null, {'statusCode':500});
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
        expect(spyClearContextInfo).calledOnce;
    });

    test('postStackAnalysisService should return error', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let spyClearContextInfo = sandbox.stub(stackAnalysisServices, 'clearContextInfo');
        let stubRequestPost = sandbox.stub(request, 'post').yields('err');
        stackAnalysisServices.postStackAnalysisService(options, context);
        expect(stubRequestPost).calledOnce;
        expect(spyClearContextInfo).calledOnce;
    });

});
