/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { isDefined } from '../utils';
import { IImage } from '../imageAnalysis/collector';
import { AnalysisReport } from '@trustify-da/trustify-da-api-model/model/v5/AnalysisReport';
import { DependencyReport } from '@trustify-da/trustify-da-api-model/model/v5/DependencyReport';
import { SourceSummary } from '@trustify-da/trustify-da-api-model/model/v5/SourceSummary';
import { ProviderReport } from '@trustify-da/trustify-da-api-model/model/v5/ProviderReport';
import { Source } from '@trustify-da/trustify-da-api-model/model/v5/Source';
import { Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { imageAnalysisService } from '../exhortServices';
import { type IOptions } from '../imageAnalysis';
import { Issue } from '@trustify-da/trustify-da-api-model/model/v5/Issue';
import { PackageURL } from 'packageurl-js';

/**
 * Represents the Red Hat Dependency Analytics (RHDA) analysis report, with images mapped by string keys.
 */
interface IExhortAnalysisReport {
  [key: string]: AnalysisReport;
}

/**
 * Represents data collected related to an image.
 */
interface IArtifact {
  id: string;
  summary: SourceSummary;
  dependencies: DependencyReport[] | undefined;
}

/**
 * Reconstructs a full image reference from a PURL string, including registry and tag.
 * @param purl - A Package URL string (e.g., `pkg:oci/go@1.25?repository_url=quay.io/hummingbird/go`).
 * @returns The full image reference (e.g., `quay.io/hummingbird/go:1.25`), or empty string if invalid.
 */
function parseImageRefFromPurl(purl: string): string {
  try {
    const parsed = PackageURL.fromString(purl);
    const repositoryUrl = parsed.qualifiers?.repository_url;
    // repository_url already contains the full image path (e.g., quay.io/hummingbird/go),
    // so use it directly. Only fall back to namespace/name when repository_url is absent.
    const fullName = repositoryUrl || [parsed.namespace, parsed.name].filter(Boolean).join('/');
    if (!parsed.version) {
      return fullName;
    }
    const separator = parsed.version.startsWith('sha256:') ? '@' : ':';
    return `${fullName}${separator}${parsed.version}`;
  } catch {
    return '';
  }
}

class ImageData {
  constructor(
    public sourceId: string,
    public issues: Issue[],
    public recommendationRef: string,
    public highestVulnerabilitySeverity: string,
    public recommendationSourceId: string = ''
  ) { }
}

class AnalysisResponse {
  images: Map<string, ImageData[]> = new Map<string, ImageData[]>();

  constructor(resData: IExhortAnalysisReport, diagnosticFilePath: Uri) {
    const failedProviders: string[] = [];

    Object.entries(resData).map(([imageRef, imageData]) => {
      if (isDefined(imageData, 'providers')) {
        Object.entries(imageData.providers).map(([providerName, providerData]: [string, ProviderReport]) => {
          if (providerData?.status?.ok) {
            const artifacts: IArtifact[] = [];
            let hasProviderRecommendations = false;

            if (isDefined(providerData, 'sources')) {
              Object.entries(providerData.sources).map(([sourceName, sourceData]: [string, Source]) => {
                if (isDefined(sourceData, 'summary')) {
                  artifacts.push({
                    id: `${providerName}(${sourceName})`,
                    summary: sourceData.summary,
                    dependencies: sourceData.dependencies,
                  });
                }
              });
            }

            if (isDefined(providerData, 'recommendations')) {
              hasProviderRecommendations = true;
              const seenRecommendations = new Set<string>();
              Object.entries(providerData.recommendations).map(([recSourceName, recSourceData]) => {
                if (recSourceData.dependencies) {
                  recSourceData.dependencies.forEach(recReport => {
                    if (recReport.recommendation) {
                      const recommendationRef = parseImageRefFromPurl(recReport.recommendation);
                      const dedupeKey = `${recommendationRef}|${recSourceName}`;
                      if (recommendationRef && !seenRecommendations.has(dedupeKey)) {
                        seenRecommendations.add(dedupeKey);
                        const sd = new ImageData(
                          providerName,
                          [],
                          recommendationRef,
                          'NONE',
                          recSourceName
                        );
                        const dataArray = this.images.get(imageRef) || [];
                        dataArray.push(sd);
                        this.images.set(imageRef, dataArray);
                      }
                    }
                  });
                }
              });
            }

            artifacts.forEach(artifact => {
              const sd = new ImageData(
                artifact.id,
                artifact.dependencies?.flatMap(dependency => dependency.issues || []) || [],
                hasProviderRecommendations ? '' : this.getRecommendation(artifact.dependencies),
                this.getHighestSeverity(artifact.summary),
              );

              const dataArray = this.images.get(imageRef) || [];
              dataArray.push(sd);
              this.images.set(imageRef, dataArray);
            });
          } else {
            failedProviders.push(providerName);
          }
        });
      }

      if (failedProviders.length !== 0) {
        const uniqueFailedProviders = Array.from(new Set(failedProviders));
        const errMsg = `The image component analysis couldn't fetch data from the following providers: [${uniqueFailedProviders.join(', ')}]`;
        outputChannelDep.warn(`Component Analysis Error: ${errMsg}`);
        notifications.emit('caError', {
          errorMessage: errMsg,
          uri: diagnosticFilePath,
        });
      }
    });
  }

  /**
   * Retrieves the total number of issues from a dependency summary.
   * @param summary The dependency summary object.
   * @returns The total number of issues.
   * @private
   */
  private getTotalIssues(summary: SourceSummary): number {
    return isDefined(summary, 'total') ? summary.total : 0;
  }

  /**
   * Retrieves the highest vulnerability severity from a source summary.
   * @param summary The source summary object.
   * @returns The highest severity level.
   * @private
   */
  private getHighestSeverity(summary: SourceSummary): string {
    let highestSeverity = 'NONE';

    if (isDefined(summary, 'critical') && summary.critical > 0) {
      highestSeverity = 'CRITICAL';
    } else if (isDefined(summary, 'high') && summary.high > 0) {
      highestSeverity = 'HIGH';
    } else if (isDefined(summary, 'medium') && summary.medium > 0) {
      highestSeverity = 'MEDIUM';
    } else if (isDefined(summary, 'low') && summary.low > 0) {
      highestSeverity = 'LOW';
    } else if (isDefined(summary, 'unknown') && summary.unknown > 0) {
      highestSeverity = 'UNKNOWN';
    }

    return highestSeverity;
  }

  /**
   * Retrieves the recommendation reference from a list of dependency objects.
   * @param dependencies The list of dependency objects.
   * @returns The recommendation reference or an empty string.
   * @private
   */
  private getRecommendation(dependencies: DependencyReport[] | undefined): string {
    let recommendation = '';
    if (dependencies && dependencies.length > 0) {
      recommendation = isDefined(dependencies[0], 'recommendation') ? parseImageRefFromPurl(dependencies[0].recommendation) : '';
    }
    return recommendation;
  }
}

/**
 * Performs RHDA image analysis on provided images.
 * @param diagnosticFilePath - The path to the image file to analyze.
 * @param images - The images to analyze.
 * @returns A Promise resolving to an AnalysisResponse object.
 */
async function executeImageAnalysis(diagnosticFilePath: Uri, images: IImage[], options: IOptions): Promise<AnalysisResponse> {
  const imageAnalysisJson = await imageAnalysisService(images.map((img) => ({
    image: img.name.value,
    platform: img.platform,
  })), false, options);

  return new AnalysisResponse(imageAnalysisJson, diagnosticFilePath);
}

export { executeImageAnalysis, AnalysisResponse, ImageData };