'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

export module stackAnalysisServices {
  export const clearContextInfo = context => {
    context.globalState.update('f8_3scale_user_key', '');
    context.globalState.update('f8_access_routes', '');
  };

  export const getStackAnalysisService = options => {
    let errorMsg: string;
    return new Promise((resolve, reject) => {
      request.get(options, (err, httpResponse, body) => {
        if (err) {
          reject(err);
        } else {
          if (
            httpResponse.statusCode === 200 ||
            httpResponse.statusCode === 202
          ) {
            let resp = JSON.parse(body);
            resolve(resp);
          } else if (httpResponse.statusCode === 401) {
            errorMsg = `Failed :: ${httpResponse.statusMessage}, Status: ${httpResponse.statusCode
              }`;
            reject(errorMsg);
          } else if (
            httpResponse.statusCode === 429 ||
            httpResponse.statusCode === 403
          ) {
            vscode.window.showInformationMessage(
              `Service is currently busy to process your request for analysis, please try again in few minutes. Status:  ${httpResponse.statusCode
              } - ${httpResponse.statusMessage} `
            );
            reject(httpResponse.statusCode);
          } else {
            errorMsg = `Failed to trigger application's stack analysis, try in a while. Status: ${httpResponse.statusCode
              } - ${httpResponse.statusMessage}`;
            reject(errorMsg);
          }
        }
      });
    });
  };

  export const postStackAnalysisService = (options, context) => {
    let errorMsg: string;
    const MAX_RETRIES = 5;
    const INITIAL_DELAY = 1000; // in milliseconds
    let retryCount = 0;

    const postRequestWithExponentialBackoff = (resolve, reject) => {
      request.post(options, (err, httpResponse, body) => {
        if (err) {
          console.log('error', err);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = INITIAL_DELAY * Math.pow(2, retryCount); // calculate delay time
            console.log(`Retry ${retryCount} in ${delay}ms`);
            setTimeout(() => postRequestWithExponentialBackoff(resolve, reject), delay);
          } else {
            clearContextInfo(context);
            reject(err);
          }
        } else {
          console.log('response Post ' + body);
          if (
            httpResponse.statusCode === 200 ||
            httpResponse.statusCode === 202
          ) {
            let resp = JSON.parse(body);
            if (resp.error === undefined && resp.status === 'success') {
              resolve(resp.id);
            } else {
              errorMsg = `Failed :: ${resp.error}, Status: ${httpResponse.statusCode
                }`;
              reject(errorMsg);
            }
          } else if (httpResponse.statusCode === 400) {
            errorMsg = `Manifest file(s) are not proper. Status:  ${httpResponse.statusCode
              } - ${httpResponse.statusMessage} `;
            reject(errorMsg);
          } else if (httpResponse.statusCode === 401) {
            clearContextInfo(context);
            errorMsg = `Failed :: ${httpResponse.statusMessage}, Status: ${httpResponse.statusCode
              }`;
            reject(errorMsg);
          } else if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = INITIAL_DELAY * Math.pow(2, retryCount); // calculate delay time
            console.log(`Retry ${retryCount} in ${delay}ms`);
            setTimeout(() => postRequestWithExponentialBackoff(resolve, reject), delay);
          } else if (
            httpResponse.statusCode === 429 ||
            httpResponse.statusCode === 403
          ) {
            errorMsg = `Service is currently busy to process your request for analysis, please try again in few minutes, Status: ${httpResponse.statusCode
              } - ${httpResponse.statusMessage}`;
            reject(errorMsg);
          } else if (httpResponse.statusCode === 408) {
            errorMsg = `Stack analysis request has timed out. Status:  ${httpResponse.statusCode
              } - ${httpResponse.statusMessage} `;
            reject(errorMsg);
          } else {
            clearContextInfo(context);
            errorMsg = `Failed to trigger application's stack analysis, try in a while. Status: ${httpResponse.statusCode
              } - ${httpResponse.statusMessage}`;
            reject(errorMsg);
          }
        }
      });
    }

    return new Promise((resolve, reject) => {
      console.log('Options', options && options.formData);
      console.log('Options', options && options.headers);
      postRequestWithExponentialBackoff(resolve, reject);
    });

  };
}
