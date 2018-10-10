'use strict';

import * as vscode from 'vscode';
import { Apiendpoint } from './apiendpoint';

export module authextension {

    const request = require('request');
    export let authorize_f8_analytics: any;
    export let get_3scale_routes: any;
    let setContextData: any;

    setContextData = (context_f8_access_routes, context_f8_3scale_user_key) => {
        Apiendpoint.STACK_API_URL = context_f8_access_routes.prod+'/api/v1/';
        Apiendpoint.STACK_API_USER_KEY = context_f8_3scale_user_key;
        Apiendpoint.OSIO_ROUTE_URL = context_f8_access_routes.prod;
        process.env['RECOMMENDER_API_URL'] = context_f8_access_routes.prod+'/api/v1';
        process.env['THREE_SCALE_USER_TOKEN'] = context_f8_3scale_user_key;
    }

    authorize_f8_analytics = (context, cb) => {
        let context_f8_access_routes = context.globalState.get('f8_access_routes');
        let context_f8_3scale_user_key = context.globalState.get('f8_3scale_user_key');
        if(context_f8_access_routes && context_f8_3scale_user_key){
            setContextData(context_f8_access_routes, context_f8_3scale_user_key);
            cb(true);
        } else {
            get_3scale_routes(context, cb);
        }
    };

    get_3scale_routes = (context,cb) => {
        let options = {};
        options['uri'] = `${Apiendpoint.THREE_SCALE_CONNECT_URL}get-endpoints?user_key=${Apiendpoint.THREE_SCALE_CONNECT_KEY}`;
        options['headers'] = {'Content-Type': 'application/json'};
        request.get(options, (err, httpResponse, body) => {
            if(err){
                cb(null);
            } else {
                if ((httpResponse.statusCode === 200 || httpResponse.statusCode === 202)) {
                    let resp = JSON.parse(body);
                    if (resp && resp.endpoints) {
                        context.globalState.update('f8_access_routes', resp.endpoints);
                        context.globalState.update('f8_3scale_user_key', resp.user_key);
                        let context_f8_access_routes = context.globalState.get('f8_access_routes');
                        let context_f8_3scale_user_key = context.globalState.get('f8_3scale_user_key');
                        setContextData(context_f8_access_routes, context_f8_3scale_user_key);
                        cb(true);
                    } else {
                        vscode.window.showErrorMessage(`Looks like there is some intermittent issue while communicating with services, please try again. Status: ${httpResponse.statusCode}`);
                        cb(null);
                    }
                } else {   
                    vscode.window.showErrorMessage(`Looks like there is some intermittent issue while communicating with services, please try again. Status: ${httpResponse.statusCode}`);
                    cb(null);
                }
            }

        });
    };

}
