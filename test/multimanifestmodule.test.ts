import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { multimanifestmodule } from '../src/multimanifestmodule';
import { authextension } from '../src/authextension';

const expect = chai.expect;
chai.use(sinonChai);

suite('multimanifest module', () => {
  let sandbox: sinon.SinonSandbox;
  let dummyMomentoData = {};
  let workspaceFolder = vscode.workspace.workspaceFolders[0];
  class DummyMemento implements vscode.Memento {
    get<T>(key: string): Promise<T | undefined> {
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

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('form_manifests_payload should throw error', async () => {
    let savedErr: string;
    sandbox.stub(multimanifestmodule, 'manifestFileRead').rejects('err');
    try {
      await multimanifestmodule.form_manifests_payload(
        'path/file',
        workspaceFolder
      );
    } catch (err) {
      savedErr = err.name;
      return;
    }
    expect(savedErr).equals('err');
    expect.fail();
  });

  test('form_manifests_payload should return form_data in success', async () => {
    sandbox.stub(multimanifestmodule, 'manifestFileRead').resolves({
      manifest: 'manifest',
      filePath: 'path'
    });
    let form_manifests_payloadPR = await multimanifestmodule.form_manifests_payload(
      'path/file',
      workspaceFolder
    );
    expect(form_manifests_payloadPR).to.include({ origin: 'lsp' });
  });

  test('manifestFileRead should return error', async () => {
    let savedErr: string;
    sandbox.stub(fs, 'readFile').yields({ message: 'err' });
    //sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns({'uri' : {'fsPath':'path/samplenodeapp', 'scheme':'file','authority':'','fragment':'', 'query': '', 'path': 'path/samplenodeapp'}});
    try {
      await multimanifestmodule.manifestFileRead('path/file', workspaceFolder);
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedErr).equals('err');
    expect.fail();
  });

  test('manifestFileRead should return data', async () => {
    let savedData: any, savedErr: string;
    sandbox.stub(fs, 'readFile').yields(null, true);
    let filePath = workspaceFolder.uri.fsPath + 'path/file/package.json';
    try {
      savedData = await multimanifestmodule.manifestFileRead(
        filePath,
        workspaceFolder
      );
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedData.filePath).equals('path/file/package.json');
  });

  test('triggerManifestWs should return error', async () => {
    let stubAuthorize_f8_analytics = sandbox
      .stub(authextension, 'authorize_f8_analytics')
      .rejects('err');
    let savedErr: string;
    try {
      await multimanifestmodule.triggerManifestWs(context);
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedErr).equals('Unable to authenticate.');
    expect.fail();
    expect(stubAuthorize_f8_analytics).callCount(1);
  });

  test('triggerManifestWs should should resolve to true', async () => {
    let stubAuthorize_f8_analytics = sandbox
      .stub(authextension, 'authorize_f8_analytics')
      .resolves(true);
    let promiseTriggerManifestWs = await multimanifestmodule.triggerManifestWs(
      context
    );
    expect(promiseTriggerManifestWs).equals(true);
    expect(stubAuthorize_f8_analytics).callCount(1);
  });

  test('triggerFullStackAnalyses should call findFiles once', async () => {
    let findFilesSpy = sandbox.spy(vscode.workspace, 'findFiles');
    try {
      await multimanifestmodule.triggerFullStackAnalyses(
        context,
        workspaceFolder
      );
    } catch (err) {
      return;
    }
    expect(findFilesSpy).callCount(1);
  });

  test('dependencyAnalyticsReportFlow should call triggerFullStackAnalyse once', async () => {
    let triggerFullStackAnalyseSpy = sandbox.spy(
      multimanifestmodule,
      'triggerFullStackAnalyses'
    );
    try {
      await multimanifestmodule.dependencyAnalyticsReportFlow(context);
    } catch (err) {
      return;
    }
    expect(triggerFullStackAnalyseSpy).callCount(1);
  });
});
