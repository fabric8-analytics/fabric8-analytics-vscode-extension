'use strict';

import * as vscode from 'vscode';
import { Apiendpoint } from './apiendpoint';

export module authextension {

    const request = require('request');
    export let authorize_f8_analytics: any;
    export let get_3scale_routes: any;

    authorize_f8_analytics = (context, cb) => {
        let osioTokenExt = vscode.extensions.getExtension('redhat.osio-auth-service');
        if(osioTokenExt){
            let importedApi = osioTokenExt.exports;
            if(importedApi && importedApi.hasOwnProperty("refresh_token") && importedApi.hasOwnProperty("access_token")) {
                Apiendpoint.OSIO_REFRESH_TOKEN = importedApi["refresh_token"];
                Apiendpoint.OSIO_ACCESS_TOKEN = importedApi["access_token"];
                process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.OSIO_ACCESS_TOKEN;
                context.globalState.update('f8_access_token', Apiendpoint.OSIO_ACCESS_TOKEN);
                context.globalState.update('f8_refresh_token', Apiendpoint.OSIO_REFRESH_TOKEN);
                let context_f8_access_token = context.globalState.get('f8_access_token');
                let context_f8_access_routes = context.globalState.get('f8_access_routes');
                let context_f8_3scale_user_key = context.globalState.get('f8_3scale_user_key');
                if(context_f8_access_token && context_f8_access_routes && context_f8_3scale_user_key){
                    Apiendpoint.STACK_API_URL = context_f8_access_routes.prod+'/api/v1/';
                    Apiendpoint.STACK_API_USER_KEY = context_f8_3scale_user_key;
                    Apiendpoint.OSIO_ROUTE_URL = context_f8_access_routes.prod;
                    process.env['RECOMMENDER_API_URL'] = context_f8_access_routes.prod+'/api/v1';
                    process.env['THREE_SCALE_USER_TOKEN'] = context_f8_3scale_user_key;
                    cb(true);
                } else {
                    get_3scale_routes(Apiendpoint, context, cb);
                }
            } else {
                vscode.window.showInformationMessage(`Looks like your extension is not authorized, kindly authorize with Openshift.io`);
                cb(null);
            }
        } else {
            vscode.window.showInformationMessage(`Looks like there is some issue with auth extension, kindly authorize with Openshift.io`);
            cb(null);
        }
        
    }

    get_3scale_routes = (Apiendpoint, context,cb) => {
        let access_token = Apiendpoint.OSIO_ACCESS_TOKEN;
        let bodyData: any = {'auth_token': `${access_token}`, 'service_id': '2555417754949'};
        let options = {};
        options['url'] = `${Apiendpoint.THREE_SCALE_CONNECT_URL}` + 'get-route';
        options['method'] = 'POST';
        options['headers'] = {'Content-Type': 'application/json'};
        options['body'] = JSON.stringify(bodyData);
        request(options, (err, httpResponse, body) => {
            if(err){
                cb(null);
            } else {
                if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
                    let resp = JSON.parse(body);
                    if (resp && resp.endpoints) {
                        context.globalState.update('f8_access_routes', resp.endpoints);
                        context.globalState.update('f8_3scale_user_key', resp.user_key);
                        Apiendpoint.STACK_API_URL = resp.endpoints.prod+'/api/v1/';
                        Apiendpoint.STACK_API_USER_KEY = resp.user_key;
                        Apiendpoint.OSIO_ROUTE_URL = resp.endpoints.prod;
                        process.env['RECOMMENDER_API_URL'] = resp.endpoints.prod+'/api/v1';
                        process.env['THREE_SCALE_USER_TOKEN'] = resp.user_key;
                        cb(true);
                    } else {
                        vscode.window.showErrorMessage(`Looks like there is some issue with authization, kindly authorize with Openshift.io, Status: ${httpResponse.statusCode}`);
                        cb(null);
                    }
                } else {   
                    vscode.window.showErrorMessage(`Looks like there is some issue with authization, kindly authorize with Openshift.io, Status: ${httpResponse.statusCode}`);
                    cb(null);
                }
            }

        });
    }

}
