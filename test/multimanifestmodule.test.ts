import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { multimanifestmodule } from '../src/multimanifestmodule';
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
        // tslint:disable-next-line:no-empty
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

    test('find_manifests_workspace should return null in callback if findFiles retuns empty list', async() => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([]);
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let savedErr: string;
        try {
            await multimanifestmodule.find_manifests_workspace(workspaceFolder, '/pom.xml');
        } catch (err) {
            savedErr = err;  
            return;
        }
        expect(savedErr).equals(`No manifest file found to be analysed`);
        expect.fail();
    });

    test('form_manifests_payload should throw error', async() => {
        let savedErr: string;
        sandbox.stub(multimanifestmodule, 'manifestFileRead').rejects('err');
        try {
            await multimanifestmodule.form_manifests_payload([{'fspath':'path/file'}]);
        } catch (err) {
            savedErr = err.name;    
            return;
        }
        expect(savedErr).equals('err');
        expect.fail();
    });

    test('form_manifests_payload should return form_data in success', async() => {
        sandbox.stub(multimanifestmodule, 'manifestFileRead').resolves([{'manifest':'manifest', 'filePath': 'path', 'license': {'value': 'sample'}}]);
        let form_manifests_payloadPR = await multimanifestmodule.form_manifests_payload([{'manifest':'manifest', 'filePath': 'path', 'license': {'value': 'sample'}}]);
        expect(form_manifests_payloadPR).to.include({'origin': 'lsp'});
    });

    
    test('manifestFileRead should return error', async() => {
        let savedErr: string;
        sandbox.stub(fs, 'readFile').yields({'message':'err'});
        //sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({'uri' : {'fsPath':'path/samplenodeapp', 'scheme':'file','authority':'','fragment':'', 'query': '', 'path': 'path/samplenodeapp'}});
        try {
            await multimanifestmodule.manifestFileRead({'fsPath': 'path'});
        } catch (err) {
            savedErr = err;    
            return;
        }
        expect(savedErr).equals('err');
        expect.fail();
    });

    test('triggerManifestWs should return error', async() => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(null);
        let savedErr: string;
        try {
            await multimanifestmodule.triggerManifestWs(context, provider, previewUri);
        } catch (err) {
            savedErr = err;  
            return;
        }
        expect(savedErr).equals('Unable to authenticate.');
        expect.fail();
        expect(stubAuthorize_f8_analytics).callCount(1);
    });

    test('triggerManifestWs should should resolve to true', async() => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
        let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').resolves(true);
        sandbox.stub(multimanifestmodule, 'find_manifests_workspace').yields(true);
        let promiseTriggerManifestWs =  await multimanifestmodule.triggerManifestWs(context, provider, previewUri);
        expect(promiseTriggerManifestWs).equals(true);
        expect(stubAuthorize_f8_analytics).callCount(1);
        expect(stubExecuteCommand).callCount(1);
    });

    test('triggerManifestWs should should return fail if executeCommand fails', async() => {
        let stubAuthorize_f8_analytics =  sandbox.stub(authextension, 'authorize_f8_analytics').yields(true);
        let stubExecuteCommand =  sandbox.stub(vscode.commands, 'executeCommand').rejects('err');
        let savedErr: string;
        try {
            await multimanifestmodule.triggerManifestWs(context, provider, previewUri);
        } catch (err) {
            savedErr = err.name;  
            return;
        }
        expect(savedErr).equals('err');
        expect.fail();
        expect(stubAuthorize_f8_analytics).callCount(1);
        expect(stubExecuteCommand).callCount(1);
    });

});