'use strict';

import * as chai from 'chai';

const expect = chai.expect;

import { Dependency, DependencyMap } from '../../src/dependencyAnalysis/collector';
import { DependencyData } from '../../src/dependencyAnalysis/analysis';
import { DiagnosticsPipeline } from '../../src/dependencyAnalysis/diagnostics';
import { getCodeActionsMap, clearCodeActionsMap } from '../../src/codeActionHandler';
import { globalConfig } from '../../src/config';
import { Uri } from 'vscode';

suite('DiagnosticsPipeline.runDiagnostics tests', () => {

    const mockUri = Uri.file('mock/path/pom.xml');

    function createDependency(name: string, version: string): Dependency {
        const dep = new Dependency({
            value: name,
            position: { line: 1, column: 1 }
        });
        dep.version = {
            value: version,
            position: { line: 1, column: 20 }
        };
        return dep;
    }

    function createDependencyData(
        issues: any[],
        recommendationRef: string,
        remediationRef: string
    ): DependencyData {
        return new DependencyData(
            'test-provider(test-source)',
            issues,
            recommendationRef,
            remediationRef,
            issues.length > 0 ? 'HIGH' : ''
        );
    }

    setup(() => {
        clearCodeActionsMap(mockUri);
        globalConfig.recommendationsEnabled = true;
        globalConfig.vulnerabilityAlertSeverity = 'Error';
        globalConfig.trackRecommendationAcceptanceCommand = 'mockTrackCommand';
    });

    teardown(() => {
        clearCodeActionsMap(mockUri);
    });

    /** Verifies that a recommendation-only dependency (no issues) registers a code action using recommendationRef. */
    test('should create code action using recommendationRef when dependency has no issues', () => {
        // Given a dependency with a recommendation but no vulnerability issues
        const dep = createDependency('org.example:lib', '1.0.0');
        const depMap = new DependencyMap([dep]);
        const pipeline = new DiagnosticsPipeline(depMap, mockUri);

        const recommendationRef = 'pkg:maven/org.example/lib-redhat@1.0.0.redhat-00001';
        const dd = createDependencyData([], recommendationRef, '');
        const dependencies = new Map<string, DependencyData[]>();
        dependencies.set('org.example:lib@1.0.0', [dd]);

        // When running diagnostics
        pipeline.runDiagnostics(dependencies, 'maven');

        // Then a code action should be registered using the recommendation ref
        const actionsMap = getCodeActionsMap().get(mockUri.toString());
        expect(actionsMap).to.not.be.undefined;
        const actions = Array.from(actionsMap!.values()).flat();
        expect(actions).to.have.lengthOf(1);
        expect(actions[0].title).to.include('1.0.0.redhat-00001');
    });

    /** Verifies that a dependency with vulnerability issues registers a code action using remediationRef. */
    test('should create code action using remediationRef when dependency has issues', () => {
        // Given a dependency with vulnerability issues and a remediation
        const dep = createDependency('org.example:lib', '1.0.0');
        const depMap = new DependencyMap([dep]);
        const pipeline = new DiagnosticsPipeline(depMap, mockUri);

        const remediationRef = 'pkg:maven/org.example/lib@1.0.1';
        const dd = createDependencyData(
            [{ id: 'CVE-2024-0001', title: 'Test Vuln', severity: 'HIGH', source: 'test' }],
            '',
            remediationRef
        );
        const dependencies = new Map<string, DependencyData[]>();
        dependencies.set('org.example:lib@1.0.0', [dd]);

        // When running diagnostics
        pipeline.runDiagnostics(dependencies, 'maven');

        // Then a code action should be registered using the remediation ref
        const actionsMap = getCodeActionsMap().get(mockUri.toString());
        expect(actionsMap).to.not.be.undefined;
        const actions = Array.from(actionsMap!.values()).flat();
        expect(actions).to.have.lengthOf(1);
        expect(actions[0].title).to.include('1.0.1');
    });

    /** Verifies that no code action is created when a recommendation-only dependency has an empty recommendationRef. */
    test('should NOT create code action when dependency has no issues and empty recommendationRef', () => {
        // Given a dependency with no issues and no recommendation
        const dep = createDependency('org.example:lib', '1.0.0');
        const depMap = new DependencyMap([dep]);
        const pipeline = new DiagnosticsPipeline(depMap, mockUri);

        const dd = createDependencyData([], '', '');
        const dependencies = new Map<string, DependencyData[]>();
        dependencies.set('org.example:lib@1.0.0', [dd]);

        // When running diagnostics
        pipeline.runDiagnostics(dependencies, 'maven');

        // Then no code action should be registered
        const actionsMap = getCodeActionsMap().get(mockUri.toString());
        if (actionsMap) {
            const actions = Array.from(actionsMap.values()).flat();
            expect(actions).to.have.lengthOf(0);
        }
    });

    /** Verifies that no code action is created when a dependency with issues has an empty remediationRef. */
    test('should NOT create code action when dependency has issues and empty remediationRef', () => {
        // Given a dependency with issues but no remediation
        const dep = createDependency('org.example:lib', '1.0.0');
        const depMap = new DependencyMap([dep]);
        const pipeline = new DiagnosticsPipeline(depMap, mockUri);

        const dd = createDependencyData(
            [{ id: 'CVE-2024-0001', title: 'Test Vuln', severity: 'HIGH', source: 'test' }],
            '',
            ''
        );
        const dependencies = new Map<string, DependencyData[]>();
        dependencies.set('org.example:lib@1.0.0', [dd]);

        // When running diagnostics
        pipeline.runDiagnostics(dependencies, 'maven');

        // Then no code action should be registered
        const actionsMap = getCodeActionsMap().get(mockUri.toString());
        if (actionsMap) {
            const actions = Array.from(actionsMap.values()).flat();
            expect(actions).to.have.lengthOf(0);
        }
    });
});
