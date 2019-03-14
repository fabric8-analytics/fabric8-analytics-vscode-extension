import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { stackanalysismodule } from '../src/stackanalysismodule';
import { ProjectDataProvider } from '../src/ProjectDataProvider';
import { multimanifestmodule } from '../src/multimanifestmodule';
import { stackAnalysisServices } from '../src/stackAnalysisService';

const expect = chai.expect;
chai.use(sinonChai);

suite('stacknalysis module', () => {
  let sandbox: sinon.SinonSandbox;
  let dummyMomentoData = {};
  let editor = {
    document: {
      uri: {
        fsPath: '/Users/sampleNodeRepo/package.json',
        path: '/Users/sampleNodeRepo/package.json',
        scheme: 'file'
      },
      fileName: '/Users/sampleNodeRepo/package.json'
    }
  };

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

  suite('stacknalysis module:', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    test('processStackAnalyses should call stackAnalysesLifeCycle for npm', async () => {
      let spyStackAnalysesLifeCycle = sandbox.spy(
        stackanalysismodule,
        'stackAnalysesLifeCycle'
      );
      await stackanalysismodule.processStackAnalyses(
        context,
        workspaceFolder,
        'npm'
      );
      expect(spyStackAnalysesLifeCycle).callCount(1);
    });
    test('processStackAnalyses should call stackAnalysesLifeCycle for maven', async () => {
      let spyStackAnalysesLifeCycle = sandbox.spy(
        stackanalysismodule,
        'stackAnalysesLifeCycle'
      );
      await stackanalysismodule.processStackAnalyses(
        context,
        workspaceFolder,
        'maven'
      );
      expect(spyStackAnalysesLifeCycle).callCount(1);
    });

    test('stackAnalysesLifeCycle should call chain of promises', async () => {
      let stubEffectivef8Package = sandbox
        .stub(ProjectDataProvider, 'effectivef8Package')
        .resolves('target/npmlist.json');
      let stubTriggerManifestWs = sandbox
        .stub(multimanifestmodule, 'triggerManifestWs')
        .resolves(true);
      let stubFormManifestPayload = sandbox
        .stub(multimanifestmodule, 'form_manifests_payload')
        .resolves({ orgin: 'vscode', ecosystem: 'npm' });
      let stubPostStackAnalysisService = sandbox
        .stub(stackAnalysisServices, 'postStackAnalysisService')
        .resolves('23445');
      let stubGetStackAnalysisService = sandbox
        .stub(stackAnalysisServices, 'getStackAnalysisService')
        .resolves({ result: '23445' });
      await stackanalysismodule.stackAnalysesLifeCycle(
        context,
        'effectivef8Package',
        'path/samplenodeapp',
        workspaceFolder
      );
      expect(stubEffectivef8Package).callCount(1);
      expect(stubTriggerManifestWs).callCount(1);
    });

    test('stackAnalysesLifeCycle should throw err', async () => {
      let stubEffectivef8Package = sandbox
        .stub(ProjectDataProvider, 'effectivef8Package')
        .rejects(false);
      try {
        await stackanalysismodule.stackAnalysesLifeCycle(
          context,
          'effectivef8Package',
          'path/samplenodeapp',
          workspaceFolder
        );
      } catch (err) {
        return;
      }
      expect(stubEffectivef8Package).callCount(1);
    });
  });
});
