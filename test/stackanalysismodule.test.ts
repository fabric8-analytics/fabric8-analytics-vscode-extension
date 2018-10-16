import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import { stackanalysismodule } from '../src/stackanalysismodule';

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis module', () => {

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
        stackanalysismodule.clearContextInfo(context);
        expect(context.globalState.get('f8_access_routes')).equals('');
        expect(context.globalState.get('f8_3scale_user_key')).equals('');
    });

});
