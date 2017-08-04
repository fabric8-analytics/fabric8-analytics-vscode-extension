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
class DiagnosticsPipelineSenti {
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
exports.DiagnosticsPipelineSenti = DiagnosticsPipelineSenti;
;
/* A consumer that uses the binding interface to consume a metadata object */
class AnalysisConsumer {
    constructor(config) {
        this.config = config;
        this.changeTo = null;
    }
    consume(data) {
        if (data && data.sentiment_details && data.sentiment_details.hasOwnProperty("latest_comment") &&
            data.sentiment_details.latest_comment != '' && data.sentiment_details.hasOwnProperty("overall_sentiment_score") &&
            data.sentiment_details.overall_sentiment_score != 0) {
            let sentiCommentObj = {
                "sentiment": "",
                "comment": ""
            };
            if (Number(data.sentiment_details.overall_sentiment_score.trim()) > 0) {
                sentiCommentObj.sentiment = "Postive";
            }
            else if (Number(data.sentiment_details.overall_sentiment_score.trim()) < 0) {
                sentiCommentObj.sentiment = "Negative";
            }
            else {
                sentiCommentObj.sentiment = "Neutral";
            }
            sentiCommentObj['timestamp'] = data.sentiment_details.latest_comment_time;
            sentiCommentObj.comment = data.sentiment_details.latest_comment;
            this.item = [];
            this.item.push(sentiCommentObj);
        }
        return this.item != null;
    }
}
;
/* We've received an empty/unfinished result, display that analysis is pending */
class EmptyResultEngineSenti extends AnalysisConsumer {
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
exports.EmptyResultEngineSenti = EmptyResultEngineSenti;
/* Report CVEs in found dependencies */
class SecurityEngineSenti extends AnalysisConsumer {
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
                message: `Sentiment : ${sentimentData[0].sentiment} , Last comment as on [${sentimentData[0]['timestamp']}]: ${sentimentData[0].comment}`,
                source: 'Sentiment Analysis'
            };
            return [diagnostic];
        }
        else {
            return [];
        }
    }
}
exports.SecurityEngineSenti = SecurityEngineSenti;
;
let codeActionsMapSenti = new Map();
exports.codeActionsMapSenti = codeActionsMapSenti;
//# sourceMappingURL=sentiment.js.map