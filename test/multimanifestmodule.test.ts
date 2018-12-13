import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { multimanifestmodule } from '../src/multimanifestmodule';
import { stackAnalysisServices } from '../src/stackAnalysisService';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { authextension } from '../src/authextension';
import { contentprovidermodule } from '../src/contentprovidermodule';

const expect = chai.expect;
chai.use(sinonChai);

suite('multimanifest module', () => {

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

    test('find_manifests_workspace should return null in callback', () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([]);
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        multimanifestmodule.find_manifests_workspace(context, workspaceFolder, '/pom.xml', (data) => {
            expect(data).equals(null);
        });
    });

    test('find_manifests_workspace should call stack_collector', () => {
        let stubStackCollector = sandbox.stub(stackanalysismodule,'stack_collector').yields(null);
        sandbox.stub(vscode.workspace, 'findFiles').resolves([{'fspath':'path/file'}]);
        sandbox.stub(multimanifestmodule, 'form_manifests_payload').yields([{'fspath':'path/file'}]);
        sandbox.stub(stackAnalysisServices, 'postStackAnalysisService').resolves('12345');
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        multimanifestmodule.find_manifests_workspace(context, workspaceFolder, '/pom.xml', (data) => {
            expect(stubStackCollector).calledOnce;
        });
    });

    test('find_manifests_workspace should return null in callback if postStackAnalysisService fails', () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([{'fspath':'path/file'}]);
        sandbox.stub(multimanifestmodule, 'form_manifests_payload').yields([{'fspath':'path/file'}]);
        sandbox.stub(stackAnalysisServices, 'postStackAnalysisService').rejects('err');
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        multimanifestmodule.find_manifests_workspace(context, workspaceFolder, '/pom.xml', (data) => {
            expect(data).equals(null);
        });
    });

    test('find_manifests_workspace should return null in callback if form_manifests_payload retuns falsy', () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([{'fspath':'path/file'}]);
        sandbox.stub(multimanifestmodule, 'form_manifests_payload').yields(null);
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        multimanifestmodule.find_manifests_workspace(context, workspaceFolder, '/pom.xml', (data) => {
            expect(data).equals(null);
        });
    });

    test('form_manifests_payload should return null in callback', () => {
        sandbox.stub(multimanifestmodule, 'manifestFileRead').rejects('err');
        multimanifestmodule.form_manifests_payload([{'fspath':'path/file'}], (data) => {
            expect(data).equals(null);
        });
    });

    test('form_manifests_payload should return form_data in callback', () => {
        let form_data = {
            'manifest[]': ['manifest'],
            'filePath[]': ['path'],
            'license[]': [{'value':'sample'}],
            origin: 'lsp'
        };
        sandbox.stub(multimanifestmodule, 'manifestFileRead').resolves([{'manifest':'manifest', 'filePath': 'path', 'license': {'value': 'sample'}}]);
        multimanifestmodule.form_manifests_payload([{'fspath':'path/file'}], (data) => {
            expect(data).equals(form_data);
        });
    });

    // test('manifestFileRead should return error', () => {
    //     sandbox.stub(fs, 'readFile').yields({'message':'err'});
    //     sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({'uri' : {'fsPath':'path/samplenodeapp', 'scheme':'file','authority':'','fragment':'', 'query': '', 'path': 'path/samplenodeapp'}});
    //     let promiseManifestFileRead = multimanifestmodule.manifestFileRead({'fsPath': 'path'});
    //     promiseManifestFileRead.catch((err)=>{
    //         expect(err).equals('err');
    //     });
    // });

    // test('manifestFileRead should return license value', () => {
    //     sandbox.stub(fs, 'readFile').yields({'message':'err'}, 123);
    //     sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({'uri' : {'fsPath':'path/samplenodeapp', 'scheme':'file', 'authority':'','fragment':'', 'query': '', 'path': 'path/samplenodeapp'}});
    //     let promiseManifestFileRead = multimanifestmodule.manifestFileRead({'fsPath': 'path/LICENSE'});
    //     promiseManifestFileRead.then((data)=>{
    //         expect(data.license.value).equals('123');
    //     });
    // });

    test('triggerManifestWs should return error', () => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(null);
        let promiseTriggerManifestWs = multimanifestmodule.triggerManifestWs(context, 'pom.xml', provider, previewUri);
        promiseTriggerManifestWs.catch((err)=>{
            expect(err).equals(undefined);
        });
        expect(stubAuthorize_f8_analytics).calledOnce;
    });

    test('triggerManifestWs should should resolve to true', () => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
        let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').resolves(true);
        sandbox.stub(multimanifestmodule, 'find_manifests_workspace').yields(true);
        let promiseTriggerManifestWs = multimanifestmodule.triggerManifestWs(context, 'pom.xml', provider, previewUri);
        promiseTriggerManifestWs.then((data)=>{
            expect(data).equals(true);
        });
        expect(stubAuthorize_f8_analytics).calledOnce;
        expect(stubExecuteCommand).calledOnce;
    });

    test('triggerManifestWs should should return fail if find_manifests_workspace fails', () => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
        let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').resolves(true);
        sandbox.stub(multimanifestmodule, 'find_manifests_workspace').yields(null);
        let promiseTriggerManifestWs = multimanifestmodule.triggerManifestWs(context, 'pom.xml', provider, previewUri);
        promiseTriggerManifestWs.catch((err)=>{
            expect(err).equals(undefined);
        });
        expect(stubAuthorize_f8_analytics).calledOnce;
        expect(stubExecuteCommand).calledOnce;
    });

});