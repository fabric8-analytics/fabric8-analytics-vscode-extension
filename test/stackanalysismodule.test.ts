import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { EventEmitter, window, Uri } from 'vscode';
import * as path from 'path';
import * as vscode from 'vscode';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { contentprovidermodule } from '../src/contentprovidermodule';

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis module', () => {

    let sandbox: sinon.SinonSandbox;
    let getStub: sinon.SinonStub;
    
    class DummyMemento implements vscode.Memento {
        get<T>(key: string): Promise<T|undefined> {
          return Promise.resolve(undefined);
        }
         update(key: string, value: any): Promise<void> {
          return Promise.resolve();
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

    let provider = new contentprovidermodule.TextDocumentContentProvider();
    let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
       sandbox.restore();
    });

    test('processStackAnalyses should have been called', () => {
        sandbox.spy(stackanalysismodule, 'processStackAnalyses')
        stackanalysismodule.triggerStackAnalyses(context, provider, previewUri)
        expect(stackanalysismodule.processStackAnalyses).calledOnce;
    });

});