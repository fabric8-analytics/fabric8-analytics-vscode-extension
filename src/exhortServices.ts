'use strict';

import exhort from '@RHEcosystemAppEng/exhort-javascript-api';

/**
 * Performs RHDA stack analysis based on the provided manifest path and options.
 * @param pathToManifest The path to the manifest file for analysis.
 * @param options Additional options for the analysis.
 * @returns A promise resolving to the stack analysis report in HTML format.
 */
function stackAnalysisService(pathToManifest, options) {
  return new Promise<any>(async (resolve, reject) => {
    try {
      // Get stack analysis in HTML format
      const stackAnalysisReportHtml = await exhort.stackAnalysis(pathToManifest, true, options);
      resolve(stackAnalysisReportHtml);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Performes RHDA token validation based on the provided options and displays messages based on the validation status.
 * @param options The options for token validation.
 * @param source The source for which the token is being validated. Example values: 'Snyk', 'OSS Index'.
 * @returns A promise resolving after validating the token.
 */
async function tokenValidationService(options, source) {
  try {

    // Get token validation status code
    const tokenValidationStatus = await exhort.validateToken(options);

    if (
      tokenValidationStatus === 200
    ) {
      return;
    } else if (
      tokenValidationStatus === 400
    ) {
      return `Missing token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
    } else if (
      tokenValidationStatus === 401
    ) {
      return `Invalid token. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
    } else if (
      tokenValidationStatus === 403
    ) {
      return `Forbidden. The token does not have permissions. Please provide a valid ${source} Token in the extension workspace settings. Status: ${tokenValidationStatus}`;
    } else if (
      tokenValidationStatus === 429
    ) {
      return `Too many requests. Rate limit exceeded. Please try again in a little while. Status: ${tokenValidationStatus}`;
    } else {
      return `Failed to validate token. Status: ${tokenValidationStatus}`;
    }
  } catch (error) {
    return `Failed to validate token, Error: ${error.message}`;
  }
}

export { stackAnalysisService, tokenValidationService };