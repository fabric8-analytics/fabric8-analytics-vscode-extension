'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';

export module authextension {

    export let authorize_f8_analytics: any;

    authorize_f8_analytics = (context, cb) => {
        let options = {
            prompt: "Action: Enter openshift.io auth token",
            placeHolder: "Please provide your auth token, can be retrieved from OSIO"
        }
        vscode.window.showInputBox(options).then(value => {
            if (!value) return;
            Apiendpoint.STACK_API_TOKEN = value;
            process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
            context.globalState.update('lastTagged', Apiendpoint.STACK_API_TOKEN);
            cb(true);
        });
  }
}