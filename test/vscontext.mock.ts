import * as vscode from 'vscode';

let dummyMomentoData = {};

class DummyMemento implements vscode.Memento {
  get<T>(key: string): Promise<T | undefined> {
    return dummyMomentoData[key];
  }
  update(key: string, value: any): Promise<any> {
    dummyMomentoData[key] = value;
    return Promise.resolve(dummyMomentoData);
  }
  keys(): readonly string[] {
    return Object.keys(dummyMomentoData);
  }
  public setKeysForSync(keys: string[]): void {
    return;
  }
}

export const context: vscode.ExtensionContext = {
  extensionPath: 'path',
  storagePath: 'string',
  logPath: 'string',
  subscriptions: { dispose(): any { } }[0],
  workspaceState: new DummyMemento(),
  globalState: new DummyMemento(),
  globalStoragePath: 'path',
  asAbsolutePath(relativePath: string): string {
    return '';
  },
  extensionUri: vscode.Uri.file(''),
  environmentVariableCollection: null,
  extensionMode: vscode.ExtensionMode.Test,
  storageUri: undefined,
  logUri: undefined,
  globalStorageUri: undefined,
  secrets: undefined,
  extension: undefined,
  languageModelAccessInformation: undefined
};


