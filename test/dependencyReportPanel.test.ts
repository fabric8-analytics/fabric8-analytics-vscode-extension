import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { DependencyReportPanel } from '../src/dependencyReportPanel';

const expect = chai.expect;
chai.use(sinonChai);

suite('DependencyReportPanel Modules', () => {
  let sandbox: sinon.SinonSandbox;

  let dummyMomentoData = {};

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
    logPath: 'string',
    // tslint:disable-next-line:no-empty
    subscriptions: { dispose(): any { } }[0],
    workspaceState: new DummyMemento(),
    globalState: new DummyMemento(),
    globalStoragePath: "",
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

  test('doUpdatePanel should render and update data', async () => {
    DependencyReportPanel.createOrShow(context.extensionPath, null);
    DependencyReportPanel.currentPanel.doUpdatePanel({ external_request_id: '12345' });
    expect(DependencyReportPanel.data.external_request_id).equals('12345');
  });

  test('dispose current panel', async () => {
    DependencyReportPanel.currentPanel.dispose();
    expect(DependencyReportPanel.currentPanel).equals(undefined);
    expect(DependencyReportPanel.data).equals(null);
  });
});
