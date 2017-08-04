/* --------------------------------------------------------------------------------------------
 * Copyright (c) Pavel Odvody 2016
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const vscode_languageserver_1 = require("vscode-languageserver");
;
/* Bind & return the part of `obj` as described by `desc` */
let bind_object = (obj, desc) => {
    let bind = obj;
    for (let elem of desc.path) {
        if (elem in bind) {
            bind = bind[elem];
        }
        else {
            return null;
        }
    }
    return bind;
};
;
;
;
;
/* Diagnostics pipeline implementation */
class DiagnosticsPipelineStack {
    constructor(classes, dependency, config, diags) {
        this.items = classes.map((i) => { return new i(dependency, config); });
        this.dependency = dependency;
        this.config = config;
        this.diagnostics = diags;
    }
    run(data) {
        for (let item of this.items) {
            if (item.consume(data)) {
                for (let d of item.produce())
                    this.diagnostics.push(d);
            }
        }
        return this.diagnostics;
    }
}
exports.DiagnosticsPipelineStack = DiagnosticsPipelineStack;
;
/* A consumer that uses the binding interface to consume a metadata object */
class AnalysisConsumer {
    constructor(config) {
        this.config = config;
        this.changeTo = null;
    }
    consume(data) {
        if (data || data.osio_user_count && data.sentiment.hasOwnProperty("overall_score") ||
            data.licenses) {
            let stackCommentObj = {
                "sentiment": "",
                "osio_user_count": "",
                "licenses": []
            };
            if (data.sentiment.hasOwnProperty("overall_score")) {
                if (Number(data.sentiment.overall_score) > 0) {
                    stackCommentObj.sentiment = "Postive";
                }
                else if (Number(data.sentiment.overall_score) < 0) {
                    stackCommentObj.sentiment = "Negative";
                }
                else {
                    stackCommentObj.sentiment = "Neutral";
                }
            }
            //stackCommentObj['timestamp'] = data.sentiment_details.latest_comment_time;
            stackCommentObj.osio_user_count = data.osio_user_count;
            stackCommentObj.licenses = data.licenses;
            this.item = [];
            this.item.push(stackCommentObj);
        }
        return this.item != null;
    }
}
;
/* We've received an empty/unfinished result, display that analysis is pending */
class EmptyResultEngineStack extends AnalysisConsumer {
    constructor(context, config) {
        super(config);
        this.context = context;
    }
    produce() {
        if (this.item == {} ||
            this.item.finished_at === undefined ||
            this.item.finished_at == null) {
            return [{
                    severity: vscode_languageserver_1.DiagnosticSeverity.Information,
                    range: utils_1.get_range(this.context.version),
                    message: `Package ${this.context.name.value}-${this.context.version.value} - analysis is pending`,
                    source: 'Sentiment Analysis'
                }];
        }
        else {
            return [];
        }
    }
}
exports.EmptyResultEngineStack = EmptyResultEngineStack;
/* Report CVEs in found dependencies */
class SecurityEngineStack extends AnalysisConsumer {
    constructor(context, config) {
        super(config);
        this.context = context;
    }
    produce() {
        if (this.item.length > 0) {
            let sentimentData = this.item;
            let diagnostic = {
                severity: vscode_languageserver_1.DiagnosticSeverity.Information,
                range: utils_1.get_range(this.context.version),
                message: `osio user count : ${sentimentData[0].osio_user_count} , Licences : [${sentimentData[0].licenses}]`,
                source: 'Stack Analysis'
            };
            return [diagnostic];
        }
        else {
            return [];
        }
    }
}
exports.SecurityEngineStack = SecurityEngineStack;
;
let codeActionsMapStack = new Map();
exports.codeActionsMapStack = codeActionsMapStack;
//# sourceMappingURL=stackanalysis.js.map