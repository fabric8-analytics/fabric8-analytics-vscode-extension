import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';
import * as paths from 'path';
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

  test('effectivef8Pom should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
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
    let stubFilterTrans = sandbox
      .stub(ProjectDataProvider, 'filterTransitiveDeps')
      .resolves('target/dependencies.txt');
    let effectivef8PomPR = await ProjectDataProvider.effectivef8Pom(
      'path/samplenodeapp/',
      workspaceFolder
    );
    expect(effectivef8PomPR).contains('target/dependencies.txt');
    expect(stubExec).callCount(1);
    expect(stubFilterTrans).callCount(1);
  });

  test('effectivef8Package should return error', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubGetDependencyVersion = sandbox
      .stub(ProjectDataProvider, 'getDependencyVersion')
      .rejects(false);
    ProjectDataProvider.effectivef8Package(
      'path/samplenodeapp/',
      workspaceFolder
    );
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
    await ProjectDataProvider.effectivef8Package(
      'path/samplenodeapp/',
      workspaceFolder
    );
    expect(stubGetDependencyVersion).callCount(1);
    expect(stubFormPackagedependencyNpmList).callCount(1);
  });

  test('formPackagedependencyNpmList should return error', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = paths.join(workspaceFolder.uri.fsPath);
    let stubReadFile = sandbox.stub(fs, 'readFile').yields('err');
    ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
    expect(stubReadFile).callCount(1);
  });

  test('formPackagedependencyNpmList should return success', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let vscodeRootpath = paths.join(workspaceFolder.uri.fsPath);
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
    let vscodeRootpath = paths.join(workspaceFolder.uri.fsPath);
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
    let vscodeRootpath = paths.join(workspaceFolder.uri.fsPath);
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    sandbox.stub(fs, 'existsSync').returns(true);
    let depVersionPromise = await ProjectDataProvider.getDependencyVersion(
      'path/samplenodeapp/',
      vscodeRootpath
    );
    expect(depVersionPromise).equals(true);
    expect(stubExec).callCount(1);
  });
});
