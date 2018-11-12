'use strict';

import * as vscode from 'vscode';
import request = require('request');

export class StackAnalysisServices {

    static clearContextInfo(context) {
        context.globalState.update('f8_3scale_user_key', '');
        context.globalState.update('f8_access_routes', '');
    };

    static getStackAnalysisService(options) {
        return new Promise((resolve, reject) => {
            request.get(options, (err, httpResponse, body) => {
                if(err){
                    reject(err);
                } else {
                    if (httpResponse.statusCode === 200 || httpResponse.statusCode === 202) {
                        let resp = JSON.parse(body);
                        resolve(resp);
                    } else if(httpResponse.statusCode === 403){
                        vscode.window.showInformationMessage(`Service is currently busy to process your request for analysis, please try again in few minutes. Status:  ${httpResponse.statusCode} `);
                        reject(httpResponse.statusCode);
                    } else {
                        vscode.window.showErrorMessage(`Failed to get stack analyzed, Status:  ${httpResponse.statusCode} `);
                        reject(httpResponse.statusCode);
                    }
                }
    
            });
        });
      };

    static postStackAnalysisService (options, context) {
        return new Promise((resolve, reject) => {
            console.log('Options', options && options.formData);
            request.post(options, (err, httpResponse, body) => {
                if(err){
                    this.clearContextInfo(context);
                    console.log('error', err);
                    reject(err);
                } else {
                    console.log('response Post '+body);
                    if ((httpResponse.statusCode === 200 || httpResponse.statusCode === 202)) {
                        let resp = JSON.parse(body);
                        if (resp.error === undefined && resp.status === 'success') {
                            resolve(resp.id);
                        } else {
                            vscode.window.showErrorMessage(`Failed :: ${resp.error}, Status: ${httpResponse.statusCode}`);
                            reject(httpResponse.statusCode);
                        }
                    } else if(httpResponse.statusCode === 401){
                        this.clearContextInfo(context);
                        vscode.window.showErrorMessage(`Looks like there is some intermittent issue while communicating with services, please try again. Status: ${httpResponse.statusCode}`);
                        reject(httpResponse.statusCode);
                    } else if(httpResponse.statusCode === 429 || httpResponse.statusCode === 403){
                        vscode.window.showInformationMessage(`Service is currently busy to process your request for analysis, please try again in few minutes. Status:  ${httpResponse.statusCode} `);
                        reject(httpResponse.statusCode);
                    } else if(httpResponse.statusCode === 400){
                        vscode.window.showInformationMessage(`Manifest file(s) are not proper. Status:  ${httpResponse.statusCode} `);
                        reject(httpResponse.statusCode);
                    } else {
                        this.clearContextInfo(context);
                        vscode.window.showErrorMessage(`Failed to trigger application's stack analysis, try in a while. Status: ${httpResponse.statusCode}`);
                        reject(httpResponse.statusCode);
                    }
                }
            });
        });
    };

}