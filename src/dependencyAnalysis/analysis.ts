/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import exhort, { Options } from '@trustify-da/trustify-da-javascript-client';

import { isDefined } from '../utils';
import { IDependencyProvider } from '../dependencyAnalysis/collector';
import { Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { AnalysisReport } from '@trustify-da/trustify-da-api-model/model/v5/AnalysisReport';
import { Source } from '@trustify-da/trustify-da-api-model/model/v5/Source';
import { DependencyReport } from '@trustify-da/trustify-da-api-model/model/v5/DependencyReport';
import { Issue } from '@trustify-da/trustify-da-api-model/model/v5/Issue';

/**
 * Represents a source object with an ID and dependencies array.
 */
interface ISource {
  id: string;
  dependencies: DependencyReport[];
}

export interface ResponseMetrics {
  scanned: {
    total: number,
    direct: number,
    transitive: number
  },
  providers: {
    [providers: string]: {
      [sources: string]: {
        total: number,
        direct: number,
        transitive: number,
        dependencies: number,
        critical: number,
        high: number,
        medium: number,
        low: number,
        remediations: number,
        recommendations: number,
      }
    }
  }
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

class AnalysisResponse {
  metrics: ResponseMetrics = {
    scanned: {
      total: 0,
      direct: 0,
      transitive: 0
    },
    providers: {}
  };
  dependencies: Map<string, DependencyData[]> = new Map<string, DependencyData[]>();
  provider: IDependencyProvider;

  constructor(resData: AnalysisReport, diagnosticFilePath: Uri, provider: IDependencyProvider) {
    this.provider = provider;
    const failedProviders: string[] = [];
    const sources: ISource[] = [];

    if (isDefined(resData, 'providers')) {
      Object.entries(resData.providers).map(([providerName, providerData]) => {
        this.metrics.providers[providerName] = {};
        if (isDefined(providerData, 'status', 'ok') && providerData.status.ok) {
          if (isDefined(providerData, 'sources')) {
            Object.entries(providerData.sources).map(([sourceName, sourceData]) => {
              sources.push({ id: `${providerName}(${sourceName})`, dependencies: this.getDependencies(sourceData) });

              if (isDefined(sourceData, 'summary')) {
                this.metrics.providers[providerName][sourceName] = {
                  dependencies: sourceData.summary.dependencies ?? 0,
                  direct: sourceData.summary.direct ?? 0,
                  transitive: sourceData.summary.transitive ?? 0,
                  critical: sourceData.summary.critical ?? 0,
                  high: sourceData.summary.high ?? 0,
                  medium: sourceData.summary.dependencies ?? 0,
                  low: sourceData.summary.low ?? 0,
                  recommendations: sourceData.summary.recommendations ?? 0,
                  remediations: sourceData.summary.remediations ?? 0,
                  total: sourceData.summary.total ?? 0,
                };
              }
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

    if (isDefined(resData, 'scanned')) {
      this.metrics.scanned = {
        direct: resData.scanned.direct ?? 0,
        total: resData.scanned.total ?? 0,
        transitive: resData.scanned.transitive ?? 0,
      };
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
async function executeComponentAnalysis(diagnosticFilePath: Uri, provider: IDependencyProvider, options: Options): Promise<AnalysisResponse> {
  const componentAnalysisJson = await exhort.componentAnalysis(diagnosticFilePath.fsPath, options);

  return new AnalysisResponse(componentAnalysisJson, diagnosticFilePath, provider);
}

export { executeComponentAnalysis, DependencyData };