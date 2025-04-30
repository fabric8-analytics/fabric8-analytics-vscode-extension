'use strict';

import * as vscode from 'vscode';
import exhort from '@trustification/exhort-javascript-api';
import { execSync } from 'child_process';

import { IImageRef, IOptions } from './imageAnalysis';

/**
 * Executes RHDA image analysis using the provided images and options.
 * @param images - The images to analyze.
 * @param options - The options for running image analysis.
 * @returns A Promise resolving to the analysis response in HTML format.
 */
async function imageAnalysisService(images: IImageRef[], options: IOptions): Promise<any> {
  const jarPath = `${__dirname}/../javaApiAdapter/exhort-java-api-adapter-1.0-SNAPSHOT-jar-with-dependencies.jar`;
  const reportType = 'html';
  let parameters = '';
  let properties = '';

  images.forEach(image => {
    if (image.platform) {
      parameters += ` ${image.image}^^${image.platform}`;
    } else {
      parameters += ` ${image.image}`;
    }
  });

  for (const setting in options) {
    if (options[setting]) {
      properties += ` -D${setting}=${options[setting]}`;
    }
  }

  return execSync(`java${properties} -jar ${jarPath} ${reportType}${parameters}`, {
    maxBuffer: 1000 * 1000 * 10, // 10 MB
  }).toString();
}

/**
 * Performs RHDA stack analysis based on the provided manifest path and options.
 * @param pathToManifest The path to the manifest file for analysis.
 * @param options Additional options for the analysis.
 * @returns A promise resolving to the stack analysis report in HTML format.
 */
async function stackAnalysisService(pathToManifest: string, options: object): Promise<string> {
  // Get stack analysis in HTML format
  return await exhort.stackAnalysis(pathToManifest, true, options);
}

/**
 * Performes RHDA token validation based on the provided options and displays messages based on the validation status.
 * @param options The options for token validation.
 * @param source The source for which the token is being validated.
 * @returns A promise resolving after validating the token.
 */
async function tokenValidationService(options: object, source: string): Promise<string | undefined> {
  try {
    // Get token validation status code
    const tokenValidationStatus = await exhort.validateToken(options);

    switch (tokenValidationStatus) {
      case 200:
        vscode.window.showInformationMessage(`${source} token validated successfully`);
        return;
      case 400:
        return `Missing token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
      case 401:
        return `Invalid token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
      case 403:
        return `Forbidden. The token does not have permissions. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
      case 429:
        return `Too many requests. Rate limit exceeded. Please try again in a little while. Status: ${tokenValidationStatus}`;
      default:
        return `Failed to validate token. Status: ${tokenValidationStatus}`;
    }
  } catch (error) {
    return `Failed to validate token, Error: ${error.message}`;
  }
}

export { imageAnalysisService, stackAnalysisService, tokenValidationService };