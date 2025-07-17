/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import exhort from '@trustification/exhort-javascript-api';
import { AnalysisReport } from '@trustification/exhort-api-spec/model/v4/AnalysisReport';

import { globalConfig } from '../config';
import { isDefined } from '../utils';
import { IDependencyProvider } from '../dependencyAnalysis/collector';
import { Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { Source } from '@trustification/exhort-api-spec/model/v4/Source';
import { DependencyReport } from '@trustification/exhort-api-spec/model/v4/DependencyReport';
import { Issue } from '@trustification/exhort-api-spec/model/v4/Issue';

/**
 * Represents a source object with an ID and dependencies array.
 */
interface ISource {
  id: string;
  dependencies: DependencyReport[];
}

/**
 * Implementation of IDependencyData interface.
 */
class DependencyData {
  constructor(
    public sourceId: string,
    public issuesCount: number,
    public recommendationRef: string,
    public remediationRef: string,
    public highestVulnerabilitySeverity: string
  ) { }
}

/**
 * Represents the parsed response of Red Hat Dependency Analytics (RHDA) analysis, with dependencies mapped by reference string.
 */
interface IAnalysisResponse {
  dependencies: Map<string, DependencyData[]>;
}

/**
 * Implementation of IAnalysisResponse interface.
 */
class AnalysisResponse implements IAnalysisResponse {
  dependencies: Map<string, DependencyData[]> = new Map<string, DependencyData[]>();
  provider: IDependencyProvider;

  constructor(resData: AnalysisReport, diagnosticFilePath: Uri, provider: IDependencyProvider) {

    this.provider = provider;
    const failedProviders: string[] = [];
    const sources: ISource[] = [];

    if (isDefined(resData, 'providers')) {
      Object.entries(resData.providers).map(([providerName, providerData]) => {
        if (isDefined(providerData, 'status', 'ok') && providerData.status.ok) {
          if (isDefined(providerData, 'sources')) {
            Object.entries(providerData.sources).map(([sourceName, sourceData]) => {
              sources.push({ id: `${providerName}(${sourceName})`, dependencies: this.getDependencies(sourceData) });
            });
          }
        } else {
          failedProviders.push(providerName);
        }
      });

      if (failedProviders.length !== 0) {
        const errMsg = `The component analysis couldn't fetch data from the following providers: [${failedProviders.join(', ')}]`;
        outputChannelDep.warn(`Component Analysis Error: ${errMsg}`);
        notifications.emit('caError', {
          errorMessage: errMsg,
          uri: diagnosticFilePath.fsPath,
        });
      }

      sources.forEach(source => {
        source.dependencies.forEach(d => {
          if (isDefined(d, 'ref')) {

            const issuesCount: number = isDefined(d, 'issues') ? d.issues.length : 0;

            const dd = issuesCount
              ? new DependencyData(source.id, issuesCount, '', this.getRemediation(d.issues![0]), this.getHighestSeverity(d))
              : new DependencyData(source.id, issuesCount, this.getRecommendation(d), '', this.getHighestSeverity(d));

            const resolvedRef = this.provider.resolveDependencyFromReference(d.ref);
            const something = (this.dependencies.get(resolvedRef) || []);
            something.push(dd);
            this.dependencies.set(resolvedRef, something);
          }
        });
      });
    }
  }

  /**
   * Retrieves dependencies from source.
   * @param sourceData The source object.
   * @returns An array of dependencies or empty array if none exists.
   * @private
   */
  private getDependencies(sourceData: Source): DependencyReport[] {
    return isDefined(sourceData, 'dependencies') ? sourceData.dependencies : [];
  }

  /**
   * Retrieves the highest vulnerability severity value from a dependency.
   * @param dependency The dependency object.
   * @returns The highest severity level or NONE if none exists.
   * @private
   */
  private getHighestSeverity(dependency: DependencyReport): string {
    return isDefined(dependency, 'highestVulnerability', 'severity') ? dependency.highestVulnerability.severity : 'NONE';
  }

  /**
   * Retrieves the remediation reference from an issue.
   * @param issue The issue object.
   * @returns The remediation reference or empty string if none exists.
   * @private
   */
  private getRemediation(issue: Issue): string {
    return isDefined(issue, 'remediation', 'trustedContent', 'ref') ? this.provider.resolveDependencyFromReference(issue.remediation.trustedContent.ref.split('?')[0]) : '';
  }

  /**
   * Retrieves the recommendation reference from a dependency.
   * @param dependency The dependency object.
   * @returns The recommendation reference or empty string if none exists.
   * @private
   */
  private getRecommendation(dependency: DependencyReport): string {
    return isDefined(dependency, 'recommendation') ? this.provider.resolveDependencyFromReference(dependency.recommendation.split('?')[0]) : '';
  }
}

/**
 * Performs RHDA component analysis on provided manifest contents/path and fileType based on ecosystem.
 * @param diagnosticFilePath - The path to the manifest file to analyze.
 * @param provider - The dependency provider of the corresponding ecosystem.
 * @returns A Promise resolving to an AnalysisResponse object.
 */
async function executeComponentAnalysis(diagnosticFilePath: Uri, provider: IDependencyProvider): Promise<AnalysisResponse> {

  // Define configuration options for the component analysis request
  const options = {
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

  // Execute component analysis
  const componentAnalysisJson = await exhort.componentAnalysis(diagnosticFilePath.fsPath, options);

  return new AnalysisResponse(componentAnalysisJson, diagnosticFilePath, provider);
}

export { executeComponentAnalysis, DependencyData };