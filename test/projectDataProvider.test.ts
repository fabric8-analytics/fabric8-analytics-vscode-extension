import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as fs from 'fs';
const child_process = require('child_process');

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

    test('effectivef8PomWs should return error', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let stubExec = sandbox.stub(child_process, 'exec').yields('err');
        ProjectDataProvider.effectivef8PomWs(workspaceFolder, (cb) => {
            expect(cb).equals(false);
        });
        expect(stubExec).calledOnce;
    });

    test('effectivef8PomWs should return success', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let stubExec = sandbox.stub(child_process, 'exec').yields(null, 'success', 'success');
        ProjectDataProvider.effectivef8PomWs(workspaceFolder, (cb) => {
            expect(cb).equals(true);
        });
        expect(stubExec).calledOnce;
    });

    test('effectivef8Pom should return error', () => {
        let stubExec = sandbox.stub(child_process, 'exec').yields('err');
        ProjectDataProvider.effectivef8Pom('path/pom.xml', (cb) => {
            expect(cb).equals(false);
        });
        expect(stubExec).calledOnce;
    });

    test('effectivef8Pom should return success', () => {
        let stubExec = sandbox.stub(child_process, 'exec').yields(null, 'success', 'success');
        ProjectDataProvider.effectivef8Pom('path/pom.xml', (cb) => {
            expect(cb).equals('path/target/pom.xml');
        });
        expect(stubExec).calledOnce;
    });

    test('effectivef8Package should return error', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let stubGetDependencyVersion = sandbox.stub(ProjectDataProvider, 'getDependencyVersion').rejects(false);
        ProjectDataProvider.effectivef8Package(workspaceFolder);
        expect(stubGetDependencyVersion).calledOnce;
    });

    test('effectivef8Package should return success', async () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let stubGetDependencyVersion = sandbox.stub(ProjectDataProvider, 'getDependencyVersion').resolves(true);
        let stubFormPackagedependencyNpmList = sandbox.stub(ProjectDataProvider, 'formPackagedependencyNpmList').resolves('sample');
        await ProjectDataProvider.effectivef8Package(workspaceFolder);
        expect(stubGetDependencyVersion).calledOnce;
        expect(stubFormPackagedependencyNpmList).calledOnce;
    });

    test('formPackagedependencyNpmList should return error', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let vscodeRootpath = workspaceFolder.uri.fsPath;
        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
            vscodeRootpath += '\\';
        } else {
            vscodeRootpath += '/'; 
        }
        let stubReadFile = sandbox.stub(fs, 'readFile').yields('err');
        ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
        expect(stubReadFile).calledOnce;
    });

    test('formPackagedependencyNpmList should return success', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let vscodeRootpath = workspaceFolder.uri.fsPath;
        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
            vscodeRootpath += '\\';
        } else {
            vscodeRootpath += '/'; 
        }
        let sampleBody = { 'status': 'success'};
        let stubReadFile = sandbox.stub(fs, 'readFile').yields(null, JSON.stringify(sampleBody));
        let stubWriteFile = sandbox.stub(fs, 'writeFile').yields(null, true);
        ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
        expect(stubReadFile).calledOnce;
        expect(stubWriteFile).calledOnce;
    });

    test('formPackagedependencyNpmList fail while writing file', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let vscodeRootpath = workspaceFolder.uri.fsPath;
        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
            vscodeRootpath += '\\';
        } else {
            vscodeRootpath += '/'; 
        }
        let sampleBody = { 'status': 'success'};
        let stubReadFile = sandbox.stub(fs, 'readFile').yields(null, JSON.stringify(sampleBody));
        let stubWriteFile = sandbox.stub(fs, 'writeFile').yields('err');
        ProjectDataProvider.formPackagedependencyNpmList(vscodeRootpath);
        expect(stubReadFile).calledOnce;
        expect(stubWriteFile).calledOnce;
    });

    test('getDependencyVersion should return success', () => {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let vscodeRootpath = workspaceFolder.uri.fsPath;
        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
            vscodeRootpath += '\\';
        } else {
            vscodeRootpath += '/'; 
        }
        let stubExec = sandbox.stub(child_process, 'exec').yields(null, 'success', 'success');
        let stubExistsSync = sandbox.stub(fs, 'existsSync').returns(true);
        ProjectDataProvider.getDependencyVersion(vscodeRootpath, (cb) => {
            expect(cb).equals(true);
        });
        expect(stubExistsSync).callCount(2);
        expect(stubExec).calledOnce;
    });

});
