'use strict';

import * as vscode from 'vscode';

import { globalConfig } from './config';
import { snykURL, ossIndexURL } from './constants';
import { tokenValidationService } from './exhortServices';

export const validateSnykToken = async () => {
    if (globalConfig.exhortSnykToken !== '') {

        // set up configuration options for the token validation request
        const options = {
            'RHDA_TOKEN': globalConfig.telemetryId,
            'RHDA_SOURCE': globalConfig.utmSource,
            'EXHORT_SNYK_TOKEN': globalConfig.exhortSnykToken
        };

        // execute token validation
        tokenValidationService(options, 'Snyk');

    } else {

        vscode.window.showInformationMessage(`Please note that if you fail to provide a valid Snyk Token in the extension workspace settings, 
                                              Snyk vulnerabilities will not be displayed. 
                                              To resolve this issue, please obtain a valid token from the following link: [here](${snykURL}).`);

    }
};

export const validateOSSIndexToken = async () => {
    if (globalConfig.exhortOSSIndexUser !== '' && globalConfig.exhortOSSIndexToken !== '') {

        // set up configuration options for the token validation request
        const options = {
            'RHDA_TOKEN': globalConfig.telemetryId,
            'RHDA_SOURCE': globalConfig.utmSource,
            'EXHORT_OSS_INDEX_USER': globalConfig.exhortOSSIndexUser,
            'EXHORT_OSS_INDEX_TOKEN': globalConfig.exhortOSSIndexToken
        };

        // execute token validation
        tokenValidationService(options, 'OSS Index');

    } else {
        let msg: string = '';

        if (globalConfig.exhortOSSIndexUser === '') {
            msg += 'OSS Index username has not been provided. ';
        }
        if (globalConfig.exhortOSSIndexToken === '') {
            msg = msg ? 'OSS Index username and token have not been provided. ' : 'OSS Index token has not been provided. ';
        }

        msg += `Please note that if you fail to provide valid OSS Index credentials in the extension workspace settings, 
        OSS Index vulnerabilities will not be displayed. 
        To resolve this issue, please register and obtain valid credentials from the following link: [here](${ossIndexURL}).`;

        vscode.window.showInformationMessage(msg);
    }
};
