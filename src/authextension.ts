'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';

export module authextension {

    const request = require('request');
    export let authorize_f8_analytics: any;
    export let get_access_token_osio: any;
    export let get_3scale_routes: any;

    authorize_f8_analytics = (context, cb) => {
        let osioTokenExt = vscode.extensions.getExtension('redhat.osio-auth-service');
        if(osioTokenExt){
            let importedApi = osioTokenExt.exports;
            if(importedApi && importedApi.hasOwnProperty("refresh_token")) {
                Apiendpoint.OSIO_REFRESH_TOKEN = importedApi["refresh_token"];
                //get_access_token_osio(Apiendpoint, context, cb);
                get_3scale_routes(Apiendpoint, context, cb);
                Apiendpoint.STACK_API_TOKEN = importedApi["access_token"];
                //Apiendpoint.OSIO_REFRESH_TOKEN = resp.token.refresh_token;
                process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
                context.globalState.update('f8_access_token', Apiendpoint.STACK_API_TOKEN);
                context.globalState.update('f8_refresh_token', Apiendpoint.OSIO_REFRESH_TOKEN);
            } else {
                vscode.window.showErrorMessage(`Looks like your extension is not authorized, kindly authorize with OSIO`);
                cb(null);
            }
        } else {
            vscode.window.showErrorMessage(`Looks like your extension is not authorized, kindly authorize with OSIO`);
            cb(null);
        }
        
    }

    get_3scale_routes = (Apiendpoint, context,cb) => {
        let access_token = context.globalState.get('f8_access_token')
        let bodyData: any = {'auth_token': `${access_token}`, 'service_id': '2555417754383'};
        let options = {};
        options['url'] = `${Apiendpoint.THREE_SCALE_CONNECT_URL}` + 'get-route';
        options['method'] = 'POST';
        options['headers'] = {'Content-Type': 'application/json'};
        options['body'] = JSON.stringify(bodyData);
        request(options, (err, httpResponse, body) => {
          if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
            let resp = JSON.parse(body);
            if (resp && resp.endpoints) {
                context.globalState.update('f8_access_routes', resp.endpoints);
                Apiendpoint.STACK_API_URL = resp.endpoints.prod+'/api/v1/stack-analyses';
                Apiendpoint.STACK_API_USER_KEY = resp.user_key;
                process.env['RECOMMENDER_API_URL_TEST'] = resp.endpoints.prod+'/api/v1';
                process.env['THREE_SCALE_USER_TOKEN'] = resp.user_key;
                cb(true);
            } else {
                vscode.window.showErrorMessage(`Failed to fetch route, Status: ${httpResponse.statusCode}`);
                cb(null);
            }
          } else {   
            vscode.window.showErrorMessage(`Failed to fetch route, Status: ${httpResponse.statusCode}`);
            cb(null);
          }
        });
    }

    get_access_token_osio = (Apiendpoint, context, cb) => {
        let bodyData: any = {'refresh_token': `${Apiendpoint.OSIO_REFRESH_TOKEN}`};
        let options = {};
        options['url'] = `${Apiendpoint.OSIO_AUTH_URL}`;
        options['method'] = 'POST';
        options['headers'] = {'Content-Type': 'application/json'};
        options['body'] = JSON.stringify(bodyData);
        request(options, (err, httpResponse, body) => {
          if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
            let resp = JSON.parse(body);
            if (resp && resp.token) {
                Apiendpoint.STACK_API_TOKEN = resp.token.access_token;
                Apiendpoint.OSIO_REFRESH_TOKEN = resp.token.refresh_token;
                process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
                context.globalState.update('f8_access_token', Apiendpoint.STACK_API_TOKEN);
                context.globalState.update('f8_refresh_token', Apiendpoint.OSIO_REFRESH_TOKEN);
                cb(true);
            } else {
                vscode.window.showErrorMessage(`Failed with Status code : ${httpResponse.statusCode}`);
                cb(null);
            }
          } else if(httpResponse.statusCode == 401){
              vscode.window.showErrorMessage(`Looks like your token is not proper, kindly authorize again`);
              cb(null);
          } else {   
            vscode.window.showErrorMessage(`Looks like your token is not proper, kindly authorize again, Status: ${httpResponse.statusCode}`);
            cb(null);
          }
        });
    }
}