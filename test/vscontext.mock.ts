import * as vscode from 'vscode';

const dummyMomentoData: { [key: string]: any } = {};

class DummyMemento implements vscode.Memento {
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  public setKeysForSync(): void {
    return;
  }
}

export const context: vscode.ExtensionContext = {
  extensionPath: 'path',
  storagePath: 'string',
  logPath: 'string',
  subscriptions: [],
  workspaceState: new DummyMemento(),
  globalState: new DummyMemento(),
  globalStoragePath: 'path',
  asAbsolutePath: () => '',
  extensionUri: vscode.Uri.file(''),
  environmentVariableCollection: null as any,
  extensionMode: vscode.ExtensionMode.Test,
  storageUri: undefined,
  logUri: undefined as any,
  globalStorageUri: undefined as any,
  secrets: undefined as any,
  extension: undefined as any,
  languageModelAccessInformation: undefined as any
};


