import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { contentprovidermodule } from '../src/contentprovidermodule';
import { ProjectDataProvider } from '../src/ProjectDataProvider';

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

    let provider = new contentprovidermodule.TextDocumentContentProvider();
    let previewUri = vscode.Uri.parse('fabric8-analytics-widget://authority/fabric8-analytics-widget');

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
       sandbox.restore();
    });

    test('get_stack_metadata should call the callback when called with invalid fileuri', () => {
        let callback = sandbox.spy();
        let showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');
        stackanalysismodule.get_stack_metadata(context, 'some/path/', callback);
        expect(callback).calledOnce;
        expect(showErrorMessageSpy).calledOnce;
    });

    test('get_stack_metadata should call the callback when called with empty file uri', () => {
        let callback = sandbox.spy();
        let showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');
        stackanalysismodule.get_stack_metadata(context, '', callback);
        expect(callback).calledOnce;
        expect(showErrorMessageSpy).calledOnce;
    });

    suite('stacknalysis module: no manifest opened', () => {

        test('triggerStackAnalyses should show info message as no manifest opened in editor', () => {
            let showOnfoMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
            stackanalysismodule.triggerStackAnalyses(context, provider, previewUri);
            expect(showOnfoMessageSpy).calledOnce;
        });
    
        test('processStackAnalyses should not call effectivef8Package', () => {
            let effectivef8PackageSpy = sandbox.spy(ProjectDataProvider, 'effectivef8Package');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(effectivef8PackageSpy).callCount(0);
        });
        
        test('processStackAnalyses should not call effectivef8Pom', () => {
            let effectivef8PomSpy = sandbox.spy(ProjectDataProvider, 'effectivef8Pom');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(effectivef8PomSpy).callCount(0);
        });

        test('processStackAnalyses should show info message as no manifest opened in editor', () => {
            let showOnfoMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(showOnfoMessageSpy).calledOnce;
        });
        
    });

});
