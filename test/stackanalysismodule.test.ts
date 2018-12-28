import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { authextension } from '../src/authextension';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { contentprovidermodule } from '../src/contentprovidermodule';
import { ProjectDataProvider } from '../src/ProjectDataProvider';
import { stackAnalysisServices } from '../src/stackAnalysisService';
import { multimanifestmodule } from '../src/multimanifestmodule';

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis module', () => {

    let sandbox: sinon.SinonSandbox;
    let dummyMomentoData = {};
    let editor = {
        'document': {
            'uri': {
                'fsPath':'/Users/sampleNodeRepo/package.json',
                'path':'/Users/sampleNodeRepo/package.json',
                'scheme':"file"
            }, 
            'fileName': '/Users/sampleNodeRepo/package.json'}};
    
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

    test('get_stack_metadata should call the callback when called with empty file uri', async () => {
        sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        await stackanalysismodule.get_stack_metadata(editor, '').catch((err) => {
            expect(err).equals('Please reopen the Project, unable to get project path');
        });
    });

    suite('stacknalysis module: no manifest opened', () => {

    
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

        test('processStackAnalyses should call effectivef8Package not effectivef8Pom as manifest file is opened in editor is package.json', async () => {
            await activateEditorSleep(1500);
            let spyEffectivef8Pom = sandbox.spy(ProjectDataProvider, 'effectivef8Pom');
            let spyWindowProgress = sandbox.spy(vscode.window, 'withProgress');
            let stubEffectivef8Package =  sandbox.stub(ProjectDataProvider, 'effectivef8Package').resolves('/path/package.json');
            let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
            let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').resolves(true);
            sandbox.stub(stackanalysismodule, 'get_stack_metadata').resolves(true);
            await stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
            expect(spyEffectivef8Pom).callCount(0);
            expect(spyWindowProgress).callCount(1);
            expect(stubEffectivef8Package).calledOnce;
            expect(stubAuthorize_f8_analytics).calledOnce;
            expect(stubExecuteCommand).calledOnce;
        });

        test('processStackAnalyses should not call authorize_f8_analytics if effectivef8Package fails', async () => {
            await activateEditorSleep(1500);
            let spyWindowProgress = sandbox.spy(vscode.window, 'withProgress');
            let stubEffectivef8Package =  sandbox.stub(ProjectDataProvider, 'effectivef8Package').yields(false);
            let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
            let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').resolves(true);
            sandbox.stub(stackanalysismodule, 'get_stack_metadata').yields(true);
            stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
            expect(spyWindowProgress).callCount(1);
            expect(stubEffectivef8Package).calledOnce;
            expect(stubAuthorize_f8_analytics).callCount(0);
            expect(stubExecuteCommand).callCount(0);
        });

    });

});
