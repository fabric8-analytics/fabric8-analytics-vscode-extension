/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { globalConfig } from '../config';
import { isDefined } from '../utils';
import { IImage } from '../imageAnalysis/collector';
import { AnalysisReport } from '@trustification/exhort-api-spec/model/v4/AnalysisReport';
import { DependencyReport } from '@trustification/exhort-api-spec/model/v4/DependencyReport';
import { SourceSummary } from '@trustification/exhort-api-spec/model/v4/SourceSummary';
import { ProviderReport } from '@trustification/exhort-api-spec/model/v4/ProviderReport';
import { Source } from '@trustification/exhort-api-spec/model/v4/Source';
import { Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { imageAnalysisService } from '../exhortServices';
import { IOptions } from '../imageAnalysis';

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

class ImageData {
  constructor(
    public sourceId: string,
    public issuesCount: number,
    public recommendationRef: string,
    public highestVulnerabilitySeverity: string
  ) { }
}

/**
 * Represents the parsed response of Red Hat Dependency Analytics (RHDA) analysis report, with images mapped by string keys.
 */
interface IAnalysisResponse {
  images: Map<string, ImageData[]>;
}

/**
 * Implementation of IAnalysisResponse interface.
 */
class AnalysisResponse implements IAnalysisResponse {
  images: Map<string, ImageData[]> = new Map<string, ImageData[]>();

  constructor(resData: IExhortAnalysisReport, diagnosticFilePath: Uri) {
    const failedProviders: string[] = [];

    Object.entries(resData).map(([imageRef, imageData]) => {
      const artifacts: IArtifact[] = [];

      if (isDefined(imageData, 'providers')) {
        Object.entries(imageData.providers).map(([providerName, providerData]: [string, ProviderReport]) => {
          if (providerData?.status?.ok) {
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
          } else {
            failedProviders.push(providerName);
          }
        });

        artifacts.forEach(artifact => {
          const sd = new ImageData(
            artifact.id,
            this.getTotalIssues(artifact.summary),
            this.getRecommendation(artifact.dependencies),
            this.getHighestSeverity(artifact.summary),
          );

          const dataArray = this.images.get(imageRef) || [];
          dataArray.push(sd);
          this.images.set(imageRef, dataArray);
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
      recommendation = isDefined(dependencies[0], 'recommendation') ? dependencies[0].recommendation.split(':')[1].split('@')[0] : '';
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
async function executeImageAnalysis(diagnosticFilePath: Uri, images: IImage[]): Promise<AnalysisResponse> {
  // Define configuration options for the component analysis request
  const options: IOptions = {
    'RHDA_TOKEN': globalConfig.telemetryId ?? '',
    'RHDA_SOURCE': globalConfig.utmSource,
    'EXHORT_SYFT_PATH': globalConfig.exhortSyftPath,
    'EXHORT_SYFT_CONFIG_PATH': globalConfig.exhortSyftConfigPath,
    'EXHORT_SKOPEO_PATH': globalConfig.exhortSkopeoPath,
    'EXHORT_SKOPEO_CONFIG_PATH': globalConfig.exhortSkopeoConfigPath,
    'EXHORT_DOCKER_PATH': globalConfig.exhortDockerPath,
    'EXHORT_PODMAN_PATH': globalConfig.exhortPodmanPath,
    'EXHORT_IMAGE_PLATFORM': globalConfig.exhortImagePlatform,
  };

  const imageAnalysisJson = await imageAnalysisService(images.map((img) => ({
    image: img.name.value,
    platform: img.platform,
  })), false, options);

  return new AnalysisResponse(imageAnalysisJson, diagnosticFilePath);
}

export { executeImageAnalysis, ImageData };