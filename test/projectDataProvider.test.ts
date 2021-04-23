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

  test('effectivef8Pom should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let effectivef8PomPR = await ProjectDataProvider.effectivef8Pom(
      workspaceFolder.uri.fsPath
    );
    expect(effectivef8PomPR).contains('target/dependencies.txt');
    expect(stubExec).callCount(1);
  });

  test('effectivef8Package should return error', () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubGetDependencyVersion = sandbox
      .stub(ProjectDataProvider, 'getDependencyVersion')
      .rejects(false);
    ProjectDataProvider.effectivef8Package(workspaceFolder.uri.fsPath);
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
    await ProjectDataProvider.effectivef8Package(workspaceFolder.uri.fsPath);
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
      'path/samplenodeapp/'
    );
    expect(depVersionPromise).equals(true);
    expect(stubExec).callCount(1);
  });

  test('effectivef8Pypi should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let effectivef8PypiPR = await ProjectDataProvider.effectivef8Pypi(
      workspaceFolder.uri.fsPath
    );
    expect(effectivef8PypiPR).contains('target/pylist.json');
    expect(stubExec).called;
  });

  test('effectivef8Golang should return success', async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let stubExec = sandbox
      .stub(child_process, 'exec')
      .yields(null, 'success', 'success');
    let effectivef8GolangPR = await ProjectDataProvider.effectivef8Golang(
      paths.join(workspaceFolder.uri.fsPath, "go.mod")
    );
    expect(effectivef8GolangPR).contains('target/golist.json');
    expect(stubExec).callCount(1);
  });
});
