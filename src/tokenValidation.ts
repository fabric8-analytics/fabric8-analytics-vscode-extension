'use strict';

import * as vscode from 'vscode';

import { globalConfig } from './config';
import { SNYK_URL } from './constants';
import { tokenValidationService } from './exhortServices';

/**
 * Validates the Snyk token using the Exhort token validation service.
 * @returns A Promise that resolves when token has been validated.
 */
async function validateSnykToken(token: string): Promise<string> {
    if (token !== '') {

        // set up configuration options for the token validation request
        const options = {
            'RHDA_TOKEN': globalConfig.telemetryId,
            'RHDA_SOURCE': globalConfig.utmSource,
            'EXHORT_SNYK_TOKEN': token
        };

        // execute token validation
        const response = await tokenValidationService(options, 'Snyk');

        return response;

    } else {

        vscode.window.showInformationMessage(`Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, 
                                              Snyk vulnerabilities will not be displayed. 
                                              To resolve this issue, please obtain a valid token from the following link: [here](${SNYK_URL}).`);
        return;

    }
}

export { validateSnykToken };
