import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { stackanalysismodule } from '../src/stackanalysismodule';
import { contentprovidermodule } from '../src/contentprovidermodule';
import { ProjectDataProvider } from '../src/ProjectDataProvider';
import { stackAnalysisServices } from '../src/stackAnalysisService';

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

    test('stack_collector should call getStackAnalysisService', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        let getStackAnalysisServiceSpy = sandbox.spy(stackAnalysisServices, 'getStackAnalysisService');
        stackanalysismodule.stack_collector('file-uri', '1234');
        expect(getStackAnalysisServiceSpy).calledOnce;
    });

    test('stack_collector should call getStackAnalysisService with success', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'getStackAnalysisService').resolves({'result':'success'});
        stackanalysismodule.stack_collector('file-uri', '1234', (callback) => {
            expect(callback.result).equals('success');
        });
    });

    test('stack_collector should call getStackAnalysisService with success having error as property', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'getStackAnalysisService').resolves({'error':'err msg'});
        stackanalysismodule.stack_collector('file-uri', '1234', (callback) => {
            expect(callback.error).equals('success');
        });
        
    });

    test('stack_collector should call getStackAnalysisService with failure', () => {
        const options = {};
        options['uri'] = 'https://abc.com';
        sandbox.stub(stackAnalysisServices, 'getStackAnalysisService').rejects({'error':'err msg'});
        stackanalysismodule.stack_collector('file-uri', '1234', (callback) => {
            expect(callback).equals(null);
        });
    });

    suite('stacknalysis module: no manifest opened', () => {

        test('triggerStackAnalyses should show info message as no manifest opened in editor', () => {
            let showInfoMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
            stackanalysismodule.triggerStackAnalyses(context, provider, previewUri);
            expect(showInfoMessageSpy).calledOnce;
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
            let showInfoMessageSpy = sandbox.spy(vscode.window, 'showInformationMessage');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(showInfoMessageSpy).calledOnce;
        }); 
    });

    suite('stacknalysis module:  manifest file  opened', () => {
        function activateEditorSleep(ms){
            return new Promise(resolve => {
                let rootPath = vscode.workspace.rootPath;
                vscode.workspace.openTextDocument(rootPath+'/package.json').then(function(TextDocument){
                    vscode.window.showTextDocument(TextDocument, vscode.ViewColumn.One, true);
                });
                setTimeout(resolve,ms);
            });
        }

        function sleep(ms){
            return new Promise(resolve => {
                setTimeout(resolve,ms);
            });
        }

        test('processStackAnalyses should not call effectivef8Pom as manifest file is opened in editor', async () => {
            await activateEditorSleep(1500);
            let spyEffectivef8Pom = sandbox.spy(ProjectDataProvider, 'effectivef8Pom');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(spyEffectivef8Pom).callCount(0);
        });

        test('processStackAnalyses should call effectivef8Package as manifest file is opened in editor', () => {
            let spyEffectivef8Package = sandbox.spy(ProjectDataProvider, 'effectivef8Package');
            stackanalysismodule.processStackAnalyses(context, provider, previewUri);
            expect(spyEffectivef8Package).calledOnce;
        });

        test('triggerStackAnalyses should call processStackAnalyses as manifest file is opened in editor', () => {
            let spyProcessStackAnalyses = sandbox.spy(stackanalysismodule, 'processStackAnalyses');
            stackanalysismodule.triggerStackAnalyses(context, provider, previewUri);
            expect(spyProcessStackAnalyses).calledOnce;
        });

        test('get_stack_metadata should call vscode API showErrorMessage as manifest file is opened in editor with invalid path', async () => {
            let rootPath = vscode.workspace.rootPath;
            let spyShowErrorMessage = sandbox.spy(vscode.window, 'showErrorMessage');
            await stackanalysismodule.get_stack_metadata(context, rootPath+'/target/tarpackage.json');
            await sleep(1500);
            expect(spyShowErrorMessage).calledOnce;
        });

        test('get_stack_metadata should call vscode API findFiles, postStackAnalysisService, form_manifests_payload as manifest file is opened in editor', async () => {
            let rootPath = vscode.workspace.rootPath;
            let spyFindFiles = sandbox.spy(vscode.workspace, 'findFiles');
            await stackanalysismodule.get_stack_metadata(context, rootPath+'/target/package.json');
            await sleep(1500);
            expect(spyFindFiles).calledOnce;
        });

    });

});
