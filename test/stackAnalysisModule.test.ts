import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as vscode from 'vscode';

import { context } from './vscontext.mock';
import { stackanalysismodule } from '../src/stackanalysismodule';
import { multimanifestmodule } from '../src/multimanifestmodule';
import { stackAnalysisServices } from '../src/stackAnalysisService';

const expect = chai.expect;
chai.use(sinonChai);

suite('stackanalysis module', () => {
  let sandbox: sinon.SinonSandbox;
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
      let stubTriggerManifestWs = sandbox
        .stub(multimanifestmodule, 'triggerManifestWs')
        .resolves(true);
      let stubFormManifestPayload = sandbox
        .stub(multimanifestmodule, 'form_manifests_payload')
        .resolves({ orgin: 'vscode', ecosystem: 'maven' });
      let stubExhortApiStackAnalysis = sandbox
        .stub(stackAnalysisServices, 'exhortApiStackAnalysis')
        .resolves('<html><body>Mock HTML response</body></html>');
      await stackanalysismodule.stackAnalysesLifeCycle(
        context,
        'path/samplenodeapp',
        'maven'
      );
      expect(stubTriggerManifestWs).callCount(1);
      expect(stubExhortApiStackAnalysis).callCount(1);
    });

    test('stackAnalysesLifeCycle should throw err', async () => {
      let stubTriggerManifestWs = sandbox
        .stub(multimanifestmodule, 'triggerManifestWs')
        .resolves(true);
      let stubFormManifestPayload = sandbox
        .stub(multimanifestmodule, 'form_manifests_payload')
        .resolves({ orgin: 'vscode', ecosystem: 'maven' });
      let stubExhortApiStackAnalysis = sandbox
        .stub(stackAnalysisServices, 'exhortApiStackAnalysis')
        .rejects(new Error("Stub Failed"));
      try {
        await stackanalysismodule.stackAnalysesLifeCycle(
          context,
          'path/samplenodeapp',
          'maven'
        );
      } catch (err) {
        return;
      }
      expect(stubExhortApiStackAnalysis).callCount(1);
    });
  });
});
