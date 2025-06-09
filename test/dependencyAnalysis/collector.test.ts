/* eslint-disable @typescript-eslint/naming-convention */
'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

import { Dependency, DependencyMap, getRange } from '../../src/dependencyAnalysis/collector';
import { DependencyProvider as PackageJson } from '../../src/providers/package.json';
import { DependencyProvider as PomXml } from '../../src/providers/pom.xml';
import { DependencyProvider as GoMod } from '../../src/providers/go.mod';
import { DependencyProvider as RequirementsTxt } from '../../src/providers/requirements.txt';
import { DependencyProvider as BuildGradle } from '../../src/providers/build.gradle';
import * as constants from '../../src/constants';
import { Position, Range } from 'vscode';

suite('Dependency Analysis Collector tests', () => {

    // Mock manifest dependency collection
    const reqDeps: Dependency[] = [
        new Dependency({ value: 'mockGroupId1/mockArtifact1', position: { line: 0, column: 0 } }),
        new Dependency({ value: 'mockGroupId2/mockArtifact2', position: { line: 0, column: 0 } })
    ];

    test('should create map of dependecies', async () => {

        const depMap = new DependencyMap(reqDeps, constants.MAVEN);

        expect(Object.fromEntries(depMap.mapper)).to.eql({
            'mockGroupId1/mockArtifact1': reqDeps[0],
            'mockGroupId2/mockArtifact2': reqDeps[1]
        });
    });

    test('should create empty dependency map', async () => {

        const depMap = new DependencyMap([], constants.MAVEN);

        expect(Object.keys(depMap.mapper).length).to.eql(0);
    });

    test('should get dependency from dependency map', async () => {

        const depMap = new DependencyMap(reqDeps, constants.MAVEN);

        expect(depMap.get(reqDeps[0].name.value)).to.eq(reqDeps[0]);
        expect(depMap.get(reqDeps[1].name.value)).to.eq(reqDeps[1]);
    });

    test('should return dependency range', async () => {

        reqDeps[0].version = { value: 'mockVersion', position: { line: 123, column: 123 } };
        reqDeps[1].context = {
            value: 'mockRange', range: new Range(new Position(123, 123), new Position(456, 456)),
        };

        expect(getRange(reqDeps[0])).to.eql(new Range(122, 122, 122, 133));

        expect(getRange(reqDeps[1])).to.eql(reqDeps[1].context.range);
    });

    test('should create map of dependecies for Gradle', async () => {

        const depMap = new DependencyMap(reqDeps, constants.GRADLE);

        expect(Object.fromEntries(depMap.mapper)).to.eql({
            'mockGroupId1/mockArtifact1@mockVersion': reqDeps[0],
            'mockGroupId2/mockArtifact2': reqDeps[1]
        });
    });

    test('should resolves a dependency reference in a specified ecosystem to its name and version string', async () => {
        const mavenDependencyProvider = new PomXml();

        const resolvedRef = mavenDependencyProvider.resolveDependencyFromReference('pkg:maven/mockGroupId1/mockArtifact1@mockVersion1');

        expect(resolvedRef).to.eq('mockGroupId1/mockArtifact1@mockVersion1');
    });

    test('should resolves a dependency reference in a specified ecosystem to its name and version string for Gradle', async () => {
        const gradleDependencyProvider = new BuildGradle();

        // Gradle references are marked as type 'maven'
        const resolvedRef = gradleDependencyProvider.resolveDependencyFromReference('pkg:maven/mockGroupId1/mockArtifact1@mockVersion1');

        expect(resolvedRef).to.eq('mockGroupId1/mockArtifact1@mockVersion1');
    });

    test('should return the name of the providers ecosystem', async () => {
        const npmDependencyProvider = new PackageJson();
        const mavenDependencyProvider = new PomXml();
        const golangDependencyProvider = new GoMod();
        const pythonDependencyProvider = new RequirementsTxt();
        const gradleDependencyProvider = new BuildGradle();

        let ecosystem = npmDependencyProvider.getEcosystem();
        expect(ecosystem).to.eq(constants.NPM);

        ecosystem = mavenDependencyProvider.getEcosystem();
        expect(ecosystem).to.eq(constants.MAVEN);

        ecosystem = golangDependencyProvider.getEcosystem();
        expect(ecosystem).to.eq(constants.GOLANG);

        ecosystem = pythonDependencyProvider.getEcosystem();
        expect(ecosystem).to.eq(constants.PYPI);

        ecosystem = gradleDependencyProvider.getEcosystem();
        expect(ecosystem).to.eq(constants.GRADLE);
    });
});
