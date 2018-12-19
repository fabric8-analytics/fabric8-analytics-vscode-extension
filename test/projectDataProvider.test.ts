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
        let stubExec = sandbox.stub(child_process, 'exec').yields('err');
        ProjectDataProvider.effectivef8PomWs('path/pom.xml', (cb) => {
            expect(cb).equals(false);
        });
        expect(stubExec).calledOnce;
    });

    test('effectivef8PomWs should return success', () => {
        let stubExec = sandbox.stub(child_process, 'exec').yields(null, 'success', 'success');
        ProjectDataProvider.effectivef8PomWs('path/pom.xml', (cb) => {
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
        let stubGetDependencyVersion = sandbox.stub(ProjectDataProvider, 'getDependencyVersion').yields(false);
        ProjectDataProvider.effectivef8Package('path/package.json', (cb) => {
            expect(cb).equals(false);
        });
        expect(stubGetDependencyVersion).calledOnce;
    });

    test('effectivef8Package should return success', () => {
        let stubGetDependencyVersion = sandbox.stub(ProjectDataProvider, 'getDependencyVersion').yields(true);
        let stubFormPackagedependencyNpmList = sandbox.stub(ProjectDataProvider, 'formPackagedependencyNpmList').resolves('sample');
        ProjectDataProvider.effectivef8Package('path/package.json', (cb) => {
            expect(cb).equals('sample');
        });
        expect(stubGetDependencyVersion).calledOnce;
        expect(stubFormPackagedependencyNpmList).calledOnce;
    });

    test('effectivef8Package should return error if formPackagedependencyNpmList fails', () => {
        let stubGetDependencyVersion = sandbox.stub(ProjectDataProvider, 'getDependencyVersion').yields(true);
        let stubFormPackagedependencyNpmList = sandbox.stub(ProjectDataProvider, 'formPackagedependencyNpmList').rejects('err');
        ProjectDataProvider.effectivef8Package('path/package.json', (cb) => {
            expect(cb).equals(false);
        });
        expect(stubGetDependencyVersion).calledOnce;
        expect(stubFormPackagedependencyNpmList).calledOnce;
    });

    test('formPackagedependencyNpmList should return error', () => {
        let stubReadFile = sandbox.stub(fs, 'readFile').yields('err');
        ProjectDataProvider.formPackagedependencyNpmList('path/package.json');
        expect(stubReadFile).calledOnce;
    });

    test('formPackagedependencyNpmList should return success', () => {
        let sampleBody = { 'status': 'success'};
        let stubReadFile = sandbox.stub(fs, 'readFile').yields(null, JSON.stringify(sampleBody));
        let stubWriteFile = sandbox.stub(fs, 'writeFile').yields(null, true);
        ProjectDataProvider.formPackagedependencyNpmList('path/package.json');
        expect(stubReadFile).calledOnce;
        expect(stubWriteFile).calledOnce;
    });

    test('formPackagedependencyNpmList fail while writing file', () => {
        let sampleBody = { 'status': 'success'};
        let stubReadFile = sandbox.stub(fs, 'readFile').yields(null, JSON.stringify(sampleBody));
        let stubWriteFile = sandbox.stub(fs, 'writeFile').yields('err');
        ProjectDataProvider.formPackagedependencyNpmList('path/package.json');
        expect(stubReadFile).calledOnce;
        expect(stubWriteFile).calledOnce;
    });

    test('getDependencyVersion should return success', () => {
        let stubExec = sandbox.stub(child_process, 'exec').yields(null, 'success', 'success');
        let stubExistsSync = sandbox.stub(fs, 'existsSync').returns(true);
        ProjectDataProvider.getDependencyVersion('path/package.json', (cb) => {
            expect(cb).equals(true);
        });
        expect(stubExistsSync).callCount(2);
        expect(stubExec).calledOnce;
    });

});
