'use strict';

import * as vscode from 'vscode';
import exhort, { ImageRef, Options, parseImageRef } from '@trustification/exhort-javascript-api';

import { IImageRef, IOptions } from './imageAnalysis';
import { AnalysisReport } from '@trustification/exhort-api-spec/model/v4/AnalysisReport';

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
function parseImageReference(image: IImageRef): ImageRef {
  if (image.platform) {
    return parseImageRef(`${image.image}^^${image.platform}`);
  } else {
    return parseImageRef(image.image);
  }
}

/**
 * Performes RHDA token validation based on the provided options and displays messages based on the validation status.
 * @param options The options for token validation.
 * @param source The source for which the token is being validated.
 * @returns A promise resolving after validating the token.
 */
async function tokenValidationService(options: { [key: string]: string }, source: string): Promise<string | undefined> {
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

export { imageAnalysisService, stackAnalysisService, tokenValidationService, parseImageReference };