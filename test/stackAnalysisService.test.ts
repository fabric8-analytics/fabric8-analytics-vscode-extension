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

    test('getStackAnalysisService should return success', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'getStackAnalysisService').resolves({'result':'success'});
        let promiseGetStackAnalysis = stackAnalysisServices.getStackAnalysisService(options);
        promiseGetStackAnalysis.then((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('success');
        });
    });

    test('getStackAnalysisService should return failure', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'getStackAnalysisService').rejects({'result':'failure'});
        let promiseGetStackAnalysis = stackAnalysisServices.getStackAnalysisService(options);
        promiseGetStackAnalysis.catch((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('failure');
        });
    });

    test('postStackAnalysisService should return success', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'postStackAnalysisService').resolves({'result':'success'});
        let promisePostStackAnalysis = stackAnalysisServices.postStackAnalysisService(options, context);
        promisePostStackAnalysis.then((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('success');
        });
    });

    test('postStackAnalysisService should return failure', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'postStackAnalysisService').rejects({'result':'failure'});
        let promisePostStackAnalysis = stackAnalysisServices.postStackAnalysisService(options, context);
        promisePostStackAnalysis.catch((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('failure');
        });
    });

    test('getStackAnalysisService should return success', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(request, 'get').returns({'result': 'sucess'});
        let promiseGetStackAnalysis = stackAnalysisServices.getStackAnalysisService(options);
        promiseGetStackAnalysis.then((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('success');
        });
    });

    test('postStackAnalysisService should return success', () => {
        const options = {};
        let stackAnalysisResp;
        options['uri'] = 'https://abc.com';
        sandbox.stub(request, 'post').returns({'result':'success'});
        let promisePostStackAnalysis = stackAnalysisServices.postStackAnalysisService(options, context);
        promisePostStackAnalysis.then((resp) => {
            stackAnalysisResp = resp['result'];
            expect(stackAnalysisResp).equals('success');
        });
    });


});
