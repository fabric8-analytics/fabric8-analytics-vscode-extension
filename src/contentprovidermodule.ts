'use strict';

import * as vscode from 'vscode';
import { Templates } from './template';

import { Apiendpoint } from './apiendpoint';

export module contentprovidermodule {

    export class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
      private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
      private _loading = true;
      private _output = null;
      private loader = Templates.LOADER_TEMPLATE;
      private header = Templates.HEADER_TEMPLATE;
      private footer = Templates.FOOTER_TEMPLATE;
      private portal_uri: string = '';

      public provideTextDocumentContent(uri: vscode.Uri): string {
              if (this._loading) {
                return this.loader;
              } else {
                if(this._output){
                  let r = this.header;
                  let token_uri = undefined;
                  this.portal_uri = `${Apiendpoint.STACK_REPORT_URL}#/analyze/${this._output.request_id}?interframe=true&api_data={"access_token":"${token_uri}","route_config":{"api_url":"${Apiendpoint.OSIO_ROUTE_URL}"},"user_key":"${Apiendpoint.STACK_API_USER_KEY}"}`;
                  r += render_stack_iframe(this.portal_uri);
                  r += this.footer;
                  return r;
                } else {
                  let r = this.header;
                  r += render_project_failure();
                  r += this.footer;
                  return r;
                }
          }
      }

      get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
      }

      public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
      }

      public signal(uri: vscode.Uri, data: string) {
          this._loading = false;
          this._output = data;
          this.update(uri);
        }

      public signalInit(uri: vscode.Uri, data: string) {
    		this._loading = true;
    		this._output = data;
    		this.update(uri);
  		}
	}

    let render_project_failure = () => {
      return `<div>
                <p style='color:#ffffff;text-align: center;'>Unable to analyze your stack.</p>
              </div>`;
    };

    let render_stack_iframe = (portaluri) => {
      // const result = sa.result[0];
      return `<iframe width="100%" height="100%" frameborder="0" src=${portaluri} id="frame2" name="frame2"></iframe>`;
    };

}
