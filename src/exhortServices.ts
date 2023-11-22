'use strict';

import * as vscode from 'vscode';
import exhort from '@RHEcosystemAppEng/exhort-javascript-api';

export const stackAnalysisService = (pathToManifest, options) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      // Get stack analysis in HTML format
      const stackAnalysisReportHtml = await exhort.stackAnalysis(pathToManifest, true, options);
      resolve(stackAnalysisReportHtml);
    } catch (error) {
      reject(error);
    }
  });
};

export const tokenValidationService = async (options, source) => {
  try {

    // Get token validation status code
    const tokenValidationStatus = await exhort.validateToken(options);

    if (
      tokenValidationStatus === 200
    ) {
      vscode.window.showInformationMessage(`${source} Token Validated Successfully`);
    } else if (
      tokenValidationStatus === 400
    ) {
      vscode.window.showWarningMessage(`Missing token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
    } else if (
      tokenValidationStatus === 401
    ) {
      vscode.window.showWarningMessage(`Invalid token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
    } else if (
      tokenValidationStatus === 403
    ) {
      vscode.window.showWarningMessage(`Forbidden. The token does not have permissions. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
    } else if (
      tokenValidationStatus === 429
    ) {
      vscode.window.showWarningMessage(`Too many requests. Rate limit exceeded. Please try again in a little while. Status: ${tokenValidationStatus}`);
    } else {
      vscode.window.showWarningMessage(`Failed to validate token. Status: ${tokenValidationStatus}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to validate token, Error: ${error}`);
  }
};