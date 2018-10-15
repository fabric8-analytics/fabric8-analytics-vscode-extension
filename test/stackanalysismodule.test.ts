import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { EventEmitter, window, Uri } from 'vscode';
import * as path from 'path';
import * as vscode from 'vscode';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { contentprovidermodule } from '../src/contentprovidermodule';
import { ProjectDataProvider } from '../src/ProjectDataProvider';

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis module', () => {

    let sandbox: sinon.SinonSandbox;
    let getStub: sinon.SinonStub;
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

    let provider = new contentprovidermodule.TextDocumentContentProvider();
    let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

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

    test('triggerStackAnalyses should call processStackAnalyses', () => {
        sandbox.spy(stackanalysismodule, 'processStackAnalyses');
        stackanalysismodule.triggerStackAnalyses(context, provider, previewUri);
        expect(stackanalysismodule.processStackAnalyses).calledOnceWith(context, provider, previewUri);
    });

    test('processStackAnalyses should call effectivef8Package for pacakage.json', () => {
        sandbox.spy(ProjectDataProvider, 'effectivef8Package');
        stackanalysismodule.processStackAnalyses(context, provider, previewUri);
        expect(ProjectDataProvider.effectivef8Package).calledOnce;
    });

    test('processStackAnalyses should not call effectivef8Pom for pacakage.json', () => {
        sandbox.spy(ProjectDataProvider, 'effectivef8Pom');
        stackanalysismodule.processStackAnalyses(context, provider, previewUri);
        expect(ProjectDataProvider.effectivef8Pom).callCount(0);
    });

    test('get_stack_metadata should call showErrorMessage notification', () => {
        sandbox.spy(vscode.window, 'showErrorMessage');
        let editor = vscode.window.activeTextEditor;
        let fileUri = editor.document.fileName.split('package.json');
        stackanalysismodule.get_stack_metadata(context, fileUri[0]+'target/package.json',(data) => {
            if(data){
                console.log(data);
            } else {
                expect(data).equals(null);
                expect(vscode.window.showErrorMessage).calledOnce;
            }
        });
    });
    
});
