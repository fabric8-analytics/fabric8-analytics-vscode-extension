'use strict';

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as path from 'path';
import { Templates } from './template';

export module contentprovidermodule {

    export class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
		private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
		private _loading = true;
		private _output = null;
        private loader = Templates.LOADER_TEMPLATE;
        private header = Templates.HEADER_TEMPLATE;
        private footer = Templates.FOOTER_TEMPLATE;

		public provideTextDocumentContent(uri: vscode.Uri): string {
			if (this._loading) {
      			return this.loader;
    		} else {
            if(this._output){
              let r = this.header;
      			  //r += render_project_info(this._output);
              r += render_stack_iframe(this._output)
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

    let render_project_info = (sa) => {
        const result = sa.result[0];
        return `<div class='item-list'>
                <div class='item'><div class='item-key'>Analysis finished</div><div class='item-value'>${sa.finished_at}</div></div>
                <div class='item'><div class='item-key'>Distinct Licenses</div><div class='item-value'>${result.user_stack_info.distinct_licenses}</div></div>
                <div class='item'><div class='item-key'>Ecosystem</div><div class='item-value'>${result.user_stack_info.ecosystem}</div></div>
                </div>
                <div>
                <p>To view detail report <a href="index.html" target="_self">Click here</a> use ID as ${sa.request_id}</p>
                </div>`;
    };

  let render_project_failure = () => {
    return `<div>
              <p>Analysis failed!!</p>
            </div>`;
  };

  let render_stack_iframe = (sa) => {
    const result = sa.result[0];
    return `<iframe width="100%" height="100%" frameborder="0" src="http://ops-portal-v2-ops-portal-ide.dev.rdu2c.fabric8.io/#/analyze/${sa.request_id}?interframe=true" id="frame2" name="frame2"></iframe>`;
  }

}
