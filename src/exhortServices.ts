'use strict';

import * as vscode from 'vscode';
import exhort, { ImageRef, Options, parseImageRef } from '@trustify-da/trustify-da-javascript-client';

import { IImageRef, type IOptions } from './imageAnalysis';
import { AnalysisReport } from '@trustify-da/trustify-da-api-model/model/v5/AnalysisReport';
import { globalConfig } from './config';

/**
 * Options for batch analysis.
 * The upstream Options type only allows string values, but the JS client's
 * stackAnalysisBatch() also accepts number, boolean, and string[] fields.
 *
 * Batch-specific fields below use camelCase property names as read by the
 * client's resolve helpers (e.g. opts.batchConcurrency first). The
 * TRUSTIFY_DA_* env var names are fallbacks via process.env, not the opts
 * keys for those settings—do not rename batch fields to match env names.
 */
export interface BatchOptions {
  [key: string]: string | number | boolean | string[] | undefined;
  batchConcurrency?: number;
  continueOnError?: boolean;
  batchMetadata?: boolean;
  workspaceDiscoveryIgnore?: string[];
}

/**
 * Builds the common options object from globalConfig, shared across
 * stack analysis, batch analysis, and token validation calls.
 */
function buildBaseOptions(): Options {
  return {
    'TRUSTIFY_DA_BACKEND_URL': globalConfig.backendUrl,
    'TRUSTIFY_DA_TELEMETRY_ID': globalConfig.telemetryId,
    'TRUSTIFY_DA_SOURCE': globalConfig.utmSource,
    'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
    'TRUSTIFY_DA_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
    'TRUSTIFY_DA_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
    'TRUSTIFY_DA_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
    'TRUSTIFY_DA_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
    'TRUSTIFY_DA_MVN_PATH': globalConfig.exhortMvnPath,
    'TRUSTIFY_DA_PREFER_MVNW': globalConfig.exhortPreferMvnw,
    'TRUSTIFY_DA_MVN_ARGS': globalConfig.exhortMvnArgs,
    'TRUSTIFY_DA_GRADLE_PATH': globalConfig.exhortGradlePath,
    'TRUSTIFY_DA_PREFER_GRADLEW': globalConfig.exhortPreferGradlew,
    'TRUSTIFY_DA_NPM_PATH': globalConfig.exhortNpmPath,
    'TRUSTIFY_DA_PNPM_PATH': globalConfig.exhortPnpmPath,
    'TRUSTIFY_DA_YARN_PATH': globalConfig.exhortYarnPath,
    'TRUSTIFY_DA_GO_PATH': globalConfig.exhortGoPath,
    'TRUSTIFY_DA_PYTHON3_PATH': globalConfig.exhortPython3Path,
    'TRUSTIFY_DA_PIP3_PATH': globalConfig.exhortPip3Path,
    'TRUSTIFY_DA_PYTHON_PATH': globalConfig.exhortPythonPath,
    'TRUSTIFY_DA_PIP_PATH': globalConfig.exhortPipPath,
    'TRUSTIFY_DA_POETRY_PATH': globalConfig.exhortPoetryPath,
    'TRUSTIFY_DA_UV_PATH': globalConfig.exhortUvPath,
    'TRUSTIFY_DA_CARGO_PATH': globalConfig.exhortCargoPath,
    'TRUSTIFY_DA_PROXY_URL': globalConfig.exhortProxyUrl,
  };
}

/**
 * Executes RHDA image analysis using the provided images and options.
 * @param images - The images to analyze.
 * @param options - The options for running image analysis.
 * @returns A Promise resolving to the analysis response in HTML or object format.
 */
async function imageAnalysisService(images: IImageRef[], html: false, options: IOptions): Promise<{ [key: string]: AnalysisReport }>;
async function imageAnalysisService(images: IImageRef[], html: true, options: IOptions): Promise<string>;

async function imageAnalysisService(images: IImageRef[], html: boolean, options: IOptions): Promise<string | { [key: string]: AnalysisReport }> {
  return await exhort.imageAnalysis(images.map(img => {
    if (img.platform) {
      return `${img.image}^^${img.platform}`;
    }
    return img.image;
  }), html, options);
}

/**
 * Performs RHDA stack analysis based on the provided manifest path and options.
 * @param pathToManifest The path to the manifest file for analysis.
 * @param options Additional options for the analysis.
 * @returns A promise resolving to the stack analysis report in HTML format.
 */
async function stackAnalysisService(pathToManifest: string, options: Options): Promise<string> {
  // Get stack analysis in HTML format
  return await exhort.stackAnalysis(pathToManifest, true, options);
}

// TODO: comment
function parseImageReference(image: IImageRef, options: IOptions): ImageRef {
  if (image.platform) {
    return parseImageRef(`${image.image}^^${image.platform}`, options);
  } else {
    return parseImageRef(image.image, options);
  }
}

/**
 * Performes RHDA token validation based on the provided options and displays messages based on the validation status.
 * @param options The options for token validation.
 * @param source The source for which the token is being validated.
 * @returns A promise resolving after validating the token.
 */
async function tokenValidationService(options: Options, source: string): Promise<string | undefined> {
  try {
    // Get token validation status code
    const response = await exhort.validateToken(options);
    const status = (response as { status: number }).status;

    switch (status) {
      case 200:
        vscode.window.showInformationMessage(`${source} token validated successfully`);
        return;
      case 400:
        return `Missing token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${status}`;
      case 401:
        return `Invalid token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${status}`;
      case 403:
        return `Forbidden. The token does not have permissions. Please provide a valid ${source} Token in the extension workspace settings. Status: ${status}`;
      case 429:
        return `Too many requests. Rate limit exceeded. Please try again in a little while. Status: ${status}`;
      default:
        return `Failed to validate token. Status: ${status}`;
    }
  } catch (error) {
    return `Failed to validate token, Error: ${(error as Error).message}`;
  }
}

/**
 * Performs RHDA batch stack analysis for all workspace packages.
 * @param workspaceRoot The path to the workspace root directory.
 * @param options Additional options for the analysis including batch-specific settings.
 * @returns A promise resolving to the batch stack analysis report in HTML format.
 */
async function batchStackAnalysisService(workspaceRoot: string, options: BatchOptions): Promise<string> {
  const result = await exhort.stackAnalysisBatch(workspaceRoot, true, options);
  // When batchMetadata is enabled, the result is { analysis, metadata };
  // otherwise it's the raw HTML string
  if (typeof result === 'string') {
    return result;
  }
  if ('analysis' in result) {
    if (typeof result.analysis !== 'string') {
      throw new Error('Unexpected non-HTML response from stackAnalysisBatch');
    }
    return result.analysis;
  }
  throw new Error('Unexpected non-HTML response from stackAnalysisBatch');
}

/**
 * Generates a CycloneDX SBOM for the given manifest file.
 * @param pathToManifest The path to the manifest file.
 * @param options Additional options for generation.
 * @returns A promise resolving to the SBOM as a parsed JSON object.
 */
async function generateSbomService(pathToManifest: string, options: Options): Promise<object> {
  return await exhort.generateSbom(pathToManifest, options);
}

export { buildBaseOptions, imageAnalysisService, stackAnalysisService, batchStackAnalysisService, tokenValidationService, parseImageReference, generateSbomService };