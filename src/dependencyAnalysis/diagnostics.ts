/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { DependencyMap, IDependencyProvider, getRange } from '../dependencyAnalysis/collector';
import { IPositionedContext } from '../positionTypes';
import { executeComponentAnalysis, DependencyData } from './analysis';
import { Vulnerability } from '../vulnerability';
import { VERSION_PLACEHOLDER } from '../constants';
import { clearCodeActionsMap, registerCodeAction, generateSwitchToRecommendedVersionAction } from '../codeActionHandler';
import { buildLogErrorMessage, buildNotificationErrorMessage } from '../utils';
import { AbstractDiagnosticsPipeline } from '../diagnosticsPipeline';
import { Diagnostic, DiagnosticSeverity, Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { globalConfig } from '../config';
import { Options } from '@trustification/exhort-javascript-api';

/**
 * Implementation of DiagnosticsPipeline interface.
 * @typeparam DependencyData - The type of elements in the dependency data array.
 */
class DiagnosticsPipeline extends AbstractDiagnosticsPipeline<DependencyData> {

  /**
   * Creates an instance of DiagnosticsPipeline.
   * @param dependencyMap - The dependency map containing information about dependencies derived from the dependency manifest.
   * @param diagnosticFilePath - The path to the manifest file to retrieve diagnostics from.
   */
  constructor(private dependencyMap: DependencyMap, diagnosticFilePath: Uri) {
    super(diagnosticFilePath);
  }

  /**
   * Runs diagnostics on dependencies.
   * @param dependencies - A map containing dependency data by reference string.
   * @param ecosystem - The name of the ecosystem in which dependencies are being analyzed.
   */
  runDiagnostics(dependencies: Map<string, DependencyData[]>, ecosystem: string) {
    dependencies.forEach((dependencyData, ref) => {
      const dependencyRef = ref.split('@')[0];
      const dependency = this.dependencyMap.get(dependencyRef);

      if (dependency) {
        const vulnerability = new Vulnerability(getRange(dependency, ecosystem), ref, dependencyData);

        const vulnerabilityDiagnostic = vulnerability.getDiagnostic();
        if (vulnerabilityDiagnostic.severity === DiagnosticSeverity.Information && !globalConfig.recommendationsEnabled) {
          return;
        }

        this.diagnostics.push(vulnerabilityDiagnostic);

        const loc = vulnerabilityDiagnostic.range.start.line + '|' + vulnerabilityDiagnostic.range.start.character;

        dependencyData.forEach(dd => {
          // TODO: we never use DiagnosticSeverity.Hint aka 3, so this always selects dd.remediationRef
          const actionRef = vulnerabilityDiagnostic.severity < 3 ? dd.remediationRef : dd.recommendationRef;
          if (actionRef) {
            this.createCodeAction(loc, actionRef, dependency.context, dd.sourceId, vulnerabilityDiagnostic);
          }

          const vulnProvider = dd.sourceId.split('(')[0];
          const issuesCount = dd.issuesCount;
          this.vulnCount.set(vulnProvider, (this.vulnCount.get(vulnProvider) || 0) + issuesCount);
        });
      }
      DiagnosticsPipeline.diagnosticsCollection.set(this.diagnosticFilePath, this.diagnostics);
    });
  }

  /**
   * Creates a code action.
   * @param loc - Location of code action effect.
   * @param ref - The reference name of the recommended package.
   * @param context - Dependency context object.
   * @param sourceId - Source ID.
   * @param vulnerabilityDiagnostic - Vulnerability diagnostic object.
   * @private
   */
  private createCodeAction(loc: string, ref: string, context: IPositionedContext | undefined, sourceId: string, vulnerabilityDiagnostic: Diagnostic) {
    const dependency = ref;
    const switchToVersion = dependency.split('@')[1];
    const versionReplacementString = context ? context.value.replace(VERSION_PLACEHOLDER, switchToVersion) : switchToVersion;
    const title = `Switch to version ${switchToVersion} for ${sourceId}`;
    const codeAction = generateSwitchToRecommendedVersionAction(title, dependency, versionReplacementString, vulnerabilityDiagnostic, this.diagnosticFilePath);
    registerCodeAction(this.diagnosticFilePath, loc, codeAction);
  }
}

/**
 * Performs diagnostics on the provided manifest file contents.
 * @param diagnosticFilePath - The path to the manifest file.
 * @param contents - The contents of the manifest file.
 * @param provider - The dependency provider of the corresponding ecosystem.
 * @returns A Promise that resolves when diagnostics are completed.
 */
async function performDiagnostics(diagnosticFilePath: Uri, contents: string, provider: IDependencyProvider) {
  try {
    // Define configuration options for the component analysis request
    const options: Options = {
      'RHDA_TOKEN': globalConfig.telemetryId,
      'RHDA_SOURCE': globalConfig.utmSource,
      'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
      'EXHORT_PROXY_URL': globalConfig.exhortProxyUrl,
      'EXHORT_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
      'EXHORT_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
      'EXHORT_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
      'EXHORT_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
      'EXHORT_MVN_PATH': globalConfig.exhortMvnPath,
      'EXHORT_PREFER_MVNW': globalConfig.exhortPreferMvnw,
      'EXHORT_MVN_ARGS': globalConfig.exhortMvnArgs,
      'EXHORT_GRADLE_PATH': globalConfig.exhortGradlePath,
      'EXHORT_NPM_PATH': globalConfig.exhortNpmPath,
      'EXHORT_YARN_PATH': globalConfig.exhortYarnPath,
      'EXHORT_PNPM_PATH': globalConfig.exhortPnpmPath,
      'EXHORT_GO_PATH': globalConfig.exhortGoPath,
      'EXHORT_PYTHON3_PATH': globalConfig.exhortPython3Path,
      'EXHORT_PIP3_PATH': globalConfig.exhortPip3Path,
      'EXHORT_PYTHON_PATH': globalConfig.exhortPythonPath,
      'EXHORT_PIP_PATH': globalConfig.exhortPipPath
    };

    const dependencies = provider.collect(contents);
    const ecosystem = provider.getEcosystem();
    const dependencyMap = new DependencyMap(dependencies);

    const diagnosticsPipeline = new DiagnosticsPipeline(dependencyMap, diagnosticFilePath);
    diagnosticsPipeline.clearDiagnostics();

    const response = await executeComponentAnalysis(diagnosticFilePath, provider, options);

    clearCodeActionsMap(diagnosticFilePath);

    diagnosticsPipeline.runDiagnostics(response.dependencies, ecosystem);

    diagnosticsPipeline.reportDiagnostics(response.metrics);
  } catch (error) {
    outputChannelDep.warn(`component analysis error: ${buildLogErrorMessage(error as Error)}`);
    notifications.emit('caError', {
      errorMessage: buildNotificationErrorMessage(error as Error),
      uri: diagnosticFilePath,
    });
  }
}

export { performDiagnostics };