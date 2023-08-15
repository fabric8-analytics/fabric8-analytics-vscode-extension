'use strict';

import * as vscode from 'vscode';
import exhort from '@RHEcosystemAppEng/exhort-javascript-api';

export module stackAnalysisServices {
  export const clearContextInfo = context => {
    context.globalState.update('f8_3scale_user_key', '');
    context.globalState.update('f8_access_routes', '');
  };

  export const exhortApiStackAnalysis = (pathToManifest, options, context) => {
    return new Promise<any>(async (resolve, reject) => {
      try {
        // Get stack analysis in HTML format
        let stackAnalysisReportHtml = await exhort.stackAnalysis(pathToManifest, true, options);
        resolve(stackAnalysisReportHtml);
      } catch (error) {
        clearContextInfo(context);
        reject(error);
      }
    });
  };

  export const getSnykTokenValidationService = async (options) => {
    try {

      // Get token validation status code
      let tokenValidationStatus = await exhort.validateToken(options);

      if (
        tokenValidationStatus === 200
      ) {
        vscode.window.showInformationMessage('Snyk Token Validated Successfully');
      } else if (
        tokenValidationStatus === 400
      ) {
        vscode.window.showWarningMessage(`Missing token. Please provide a valid Snyk Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
      } else if (
        tokenValidationStatus === 401
      ) {
        vscode.window.showWarningMessage(`Invalid token. Please provide a valid Snyk Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
      } else if (
        tokenValidationStatus === 403
      ) {
        vscode.window.showWarningMessage(`Forbidden. The token does not have permissions. Please provide a valid Snyk Token in the extension workspace settings. Status: ${tokenValidationStatus}`);
      } else if (
        tokenValidationStatus === 429
      ) {
        vscode.window.showWarningMessage(`Too many requests. Rate limit exceeded. Please try again in a little while. Status: ${tokenValidationStatus}`);
      } else {
        vscode.window.showWarningMessage(`Failed to validate token. Status: ${tokenValidationStatus}`);
      }
    } catch (error) {
      clearContextInfo(context);
      vscode.window.showErrorMessage(`Failed to validate token, Error: ${error}`);
    }
  };
}
