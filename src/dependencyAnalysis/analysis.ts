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
import { LicenseInfo } from '@trustify-da/trustify-da-api-model/model/v5/LicenseInfo';
import { LicenseProviderResult } from '@trustify-da/trustify-da-api-model/model/v5/LicenseProviderResult';
import { TokenProvider } from '../tokenProvider';

/**
 * Extended AnalysisReport with packageManager field added by the JS client at runtime.
 * The JS client's componentAnalysis() dynamically adds this field before returning.
 */
interface ComponentAnalysisResult extends AnalysisReport {
  packageManager?: string;
}

/**
 * Represents a source object with an ID and dependencies array.
 */
interface ISource {
  id: string;
  dependencies: DependencyReport[];
  hasProviderRecommendations: boolean;
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
        unknown: number,
        remediations: number,
        recommendations: number,
      }
    }
  }
}

/**
 * Fix version option extracted from remediation data (advisory-level or top-level fixedIn).
 */
interface FixOption {
  version: string;
  ref: string;
  advisoryId?: string;
  remediationCategory?: string;
  remediationDetails?: string;
  remediationUrl?: string;
}

/**
 * Implementation of IDependencyData interface.
 */
class DependencyData {
  public fixOptions: FixOption[];

  constructor(
    public sourceId: string,
    public issues: Issue[],
    public recommendationRef: string,
    public remediationRef: string,
    public highestVulnerabilitySeverity: string,
    public packageManager: string = '',
    public recommendationSourceId: string = '',
    fixOptions: FixOption[] = []
  ) {
    this.fixOptions = fixOptions;
  }
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
  licenseSummary?: {
    projectLicense?: {
      manifest?: LicenseInfo;
      file?: LicenseInfo;
      mismatch: boolean;
    };
    incompatibleDependencies?: Array<{
      purl: string;
      licenses: string[];
      category: string;
      reason: string;
    }>;
  };
  licenses?: Array<LicenseProviderResult>;

  constructor(resData: AnalysisReport, diagnosticFilePath: Uri, provider: IDependencyProvider, packageManager: string = '') {
    this.provider = provider;
    const failedProviders: string[] = [];
    const sources: ISource[] = [];

    if (isDefined(resData, 'providers')) {
      Object.entries(resData.providers).map(([providerName, providerData]) => {
        this.metrics.providers[providerName] = {};
        if (isDefined(providerData, 'status', 'ok') && providerData.status.ok) {
          const hasProviderRecommendations = isDefined(providerData, 'recommendations');

          if (isDefined(providerData, 'sources')) {
            Object.entries(providerData.sources).map(([sourceName, sourceData]) => {
              sources.push({
                id: `${providerName}(${sourceName})`,
                dependencies: this.getDependencies(sourceData),
                hasProviderRecommendations,
              });

              if (isDefined(sourceData, 'summary')) {
                this.metrics.providers[providerName][sourceName] = {
                  dependencies: sourceData.summary.dependencies ?? 0,
                  direct: sourceData.summary.direct ?? 0,
                  transitive: sourceData.summary.transitive ?? 0,
                  critical: sourceData.summary.critical ?? 0,
                  high: sourceData.summary.high ?? 0,
                  medium: sourceData.summary.medium ?? 0,
                  low: sourceData.summary.low ?? 0,
                  unknown: sourceData.summary.unknown ?? 0,
                  recommendations: sourceData.summary.recommendations ?? 0,
                  remediations: sourceData.summary.remediations ?? 0,
                  total: sourceData.summary.total ?? 0,
                };
              }
            });
          }

          if (hasProviderRecommendations) {
            Object.entries(providerData.recommendations).map(([recSourceName, recSourceData]) => {
              if (recSourceData.dependencies) {
                recSourceData.dependencies.forEach(recReport => {
                  if (isDefined(recReport, 'ref') && isDefined(recReport, 'recommendation')) {
                    const resolvedRef = this.provider.resolveDependencyFromReference(recReport.ref);
                    const recommendationRef = this.provider.resolveDependencyFromReference(recReport.recommendation.split('?')[0]);
                    const dd = new DependencyData(
                      providerName,
                      [],
                      recommendationRef,
                      '',
                      'NONE',
                      packageManager,
                      recSourceName
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    this.dependencies.get(resolvedRef)?.push(dd) || this.dependencies.set(resolvedRef, [dd]);
                  }
                });
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
            const issues = isDefined(d, 'issues') ? d.issues : [];
            const resolvedRef = this.provider.resolveDependencyFromReference(d.ref);

            let dd: DependencyData;
            if (issues.length) {
              const remediationRef = this.getRemediation(issues[0]);
              const fixOptions = this.extractFixOptions(issues, resolvedRef, remediationRef);
              dd = new DependencyData(source.id, issues, '', remediationRef, this.getHighestSeverity(d), '', '', fixOptions);
            } else if (!source.hasProviderRecommendations) {
              dd = new DependencyData(source.id, issues, this.getRecommendation(d), '', this.getHighestSeverity(d), packageManager);
            } else {
              return;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this.dependencies.get(resolvedRef)?.push(dd) || this.dependencies.set(resolvedRef, [dd]);
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

    // Extract license summary (added by trustify-da-javascript-client)
    if (isDefined(resData, 'licenseSummary')) {
      this.licenseSummary = (resData as any).licenseSummary;
    }

    // Extract full license data from backend
    if (isDefined(resData, 'licenses')) {
      this.licenses = resData.licenses;
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
   * Extracts fix version options from remediation data across all issues.
   * Reads from both advisory-level fixedIn and top-level remediation.fixedIn[].
   * Deduplicates by version and excludes versions already covered by trustedContent.
   * @private
   */
  private extractFixOptions(issues: Issue[], depRef: string, remediationRef: string): FixOption[] {
    const packageName = depRef.split('@')[0];
    const seenVersions = new Set<string>();

    const trustedContentVersion = remediationRef ? remediationRef.split('@').pop() : '';
    if (trustedContentVersion) {
      seenVersions.add(trustedContentVersion);
    }

    const options: FixOption[] = [];

    for (const issue of issues) {
      if (!isDefined(issue, 'remediation')) {
        continue;
      }
      const rem = issue.remediation;

      if (rem.advisories) {
        for (const adv of rem.advisories) {
          if (!adv.fixedIn || seenVersions.has(adv.fixedIn)) {
            continue;
          }
          seenVersions.add(adv.fixedIn);
          const firstRemediation = adv.remediations?.[0];
          options.push({
            version: adv.fixedIn,
            ref: `${packageName}@${adv.fixedIn}`,
            advisoryId: adv.advisory?.id,
            remediationCategory: firstRemediation?.category as string | undefined,
            remediationDetails: firstRemediation?.details,
            remediationUrl: firstRemediation?.url,
          });
        }
      }

      if (rem.fixedIn) {
        for (const version of rem.fixedIn) {
          if (!version || seenVersions.has(version)) {
            continue;
          }
          seenVersions.add(version);
          options.push({
            version,
            ref: `${packageName}@${version}`,
          });
        }
      }
    }

    return options;
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
async function executeComponentAnalysis(tokenProvider: TokenProvider, diagnosticFilePath: Uri, provider: IDependencyProvider, options: Options): Promise<AnalysisResponse> {
  const componentAnalysisJson = await exhort.componentAnalysis(diagnosticFilePath.fsPath, options) as ComponentAnalysisResult;
  const packageManager = componentAnalysisJson.packageManager || '';

  return new AnalysisResponse(componentAnalysisJson, diagnosticFilePath, provider, packageManager);
}

export { executeComponentAnalysis, DependencyData, FixOption };