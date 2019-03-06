import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';
import * as child_process from 'child_process';

import { ProjectDataProvider } from '../src/ProjectDataProvider';

const expect = chai.expect;
chai.use(sinonChai);

suite('projectDataProvider Modules', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

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

  test('effectivef8PomWs should return error', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubExec = sandbox.stub(child_process, 'exec').yields('err');
    let savedErr: boolean;
    try {
      await ProjectDataProvider.effectivef8PomWs(workspaceFolder);
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedErr).equals(false);
    expect.fail();
    expect(stubExec).callCount(1);
  });

  test('effectivef8PomWs should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let effectivef8PomWsPR = await ProjectDataProvider.effectivef8PomWs(
      workspaceFolder
    );
    expect(effectivef8PomWsPR).equals(true);
    expect(stubExec).callCount(1);
  });

  test('effectivef8Pom should return error', async () => {
    let stubExec = sandbox.stub(child_process, 'exec').yields('err');
    let savedErr: boolean;
    try {
      await ProjectDataProvider.effectivef8Pom(editor);
    } catch (err) {
      savedErr = err;
      return;
    }
    expect(savedErr).equals(false);
    expect.fail();
    expect(stubExec).callCount(1);
  });

  test('effectivef8Pom should return success', async () => {
    sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns(<any>{
      uri: {
        fsPath: 'path/samplenodeapp',
        scheme: 'file',
        authority: '',
        fragment: '',
        query: '',
        path: 'path/samplenodeapp'
      }
    });
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let effectivef8PomPR = await ProjectDataProvider.effectivef8Pom(editor);
    expect(effectivef8PomPR).equals(
      'path/samplenodeapp/target/dependencies.txt'
    );
    expect(stubExec).callCount(1);
  });

  test('effectivef8Package should return error', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubGetDependencyVersion = sandbox
      .stub(ProjectDataProvider, 'getDependencyVersion')
      .rejects(false);
    ProjectDataProvider.effectivef8Package(workspaceFolder);
    expect(stubGetDependencyVersion).callCount(1);
  });

  test('effectivef8Package should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubGetDependencyVersion = sandbox
      .stub(ProjectDataProvider, 'getDependencyVersion')
      .resolves(true);
    let stubFormPackagedependencyNpmList = sandbox
      .stub(ProjectDataProvider, 'formPackagedependencyNpmList')
      .resolves('sample');
    await ProjectDataProvider.effectivef8Package(workspaceFolder);
    expect(stubGetDependencyVersion).callCount(1);
    expect(stubFormPackagedependencyNpmList).callCount(1);
  });

  test('formPackagedependencyNpmList should return error', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = workspaceFolder.uri.fsPath;
    if (
      process &&
      process.platform &&
      process.platform.toLowerCase() === 'win32'
    ) {
      vscodeRootpath += '\\';
    } else {
      vscodeRootpath += '/';
    }
    let stubReadFile = sandbox.stub(fs, 'readFile').yields('err');
    ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
    expect(stubReadFile).callCount(1);
  });

  test('formPackagedependencyNpmList should return success', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = workspaceFolder.uri.fsPath;
    if (
      process &&
      process.platform &&
      process.platform.toLowerCase() === 'win32'
    ) {
      vscodeRootpath += '\\';
    } else {
      vscodeRootpath += '/';
    }
    let sampleBody = { status: 'success' };
    let stubReadFile = sandbox
      .stub(fs, 'readFile')
      .yields(null, JSON.stringify(sampleBody));
    let stubWriteFile = sandbox.stub(fs, 'writeFile').yields(null, true);
    ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
    expect(stubReadFile).callCount(1);
    expect(stubWriteFile).callCount(1);
  });

  test('formPackagedependencyNpmList fail while writing file', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = workspaceFolder.uri.fsPath;
    if (
      process &&
      process.platform &&
      process.platform.toLowerCase() === 'win32'
    ) {
      vscodeRootpath += '\\';
    } else {
      vscodeRootpath += '/';
    }
    let sampleBody = { status: 'success' };
    let stubReadFile = sandbox
      .stub(fs, 'readFile')
      .yields(null, JSON.stringify(sampleBody));
    let stubWriteFile = sandbox.stub(fs, 'writeFile').yields('err');
    ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
    expect(stubReadFile).callCount(1);
    expect(stubWriteFile).callCount(1);
  });

  test('getDependencyVersion should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = workspaceFolder.uri.fsPath;
    if (
      process &&
      process.platform &&
      process.platform.toLowerCase() === 'win32'
    ) {
      vscodeRootpath += '\\';
    } else {
      vscodeRootpath += '/';
    }
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let stubExistsSync = sandbox.stub(fs, 'existsSync').returns(true);
    let depVersionPromise = await ProjectDataProvider.getDependencyVersion(
      vscodeRootpath
    );
    expect(depVersionPromise).equals(true);
    expect(stubExistsSync).callCount(2);
    expect(stubExec).callCount(1);
  });
});
