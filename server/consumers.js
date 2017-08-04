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
class DiagnosticsPipeline {
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
exports.DiagnosticsPipeline = DiagnosticsPipeline;
;
/* A consumer that uses the binding interface to consume a metadata object */
class AnalysisConsumer {
    constructor(config) {
        this.config = config;
        this.changeTo = null;
    }
    consume(data) {
        if (this.binding != null) {
            this.item = bind_object(data, this.binding);
        }
        else {
            this.item = data;
        }
        if (this.changeToBinding != null) {
            this.changeTo = bind_object(data, this.changeToBinding);
        }
        return this.item != null;
    }
}
;
/* We've received an empty/unfinished result, display that analysis is pending */
class EmptyResultEngine extends AnalysisConsumer {
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
                    source: 'Component Analysis'
                }];
        }
        else {
            return [];
        }
    }
}
exports.EmptyResultEngine = EmptyResultEngine;
/* Report CVEs in found dependencies */
class SecurityEngine extends AnalysisConsumer {
    constructor(context, config) {
        super(config);
        this.context = context;
        this.binding = { path: ['result', 'recommendation', 'component-analyses', 'cve'] };
        /* recommendation to use a different version */
        this.changeToBinding = { path: ['result', 'recommendation', 'change_to'] };
    }
    produce() {
        if (this.item.length > 0) {
            let cveList = [];
            for (let cve of this.item) {
                cveList.push(cve['id']);
            }
            let cves = cveList.join(' ');
            let diagnostic = {
                severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                range: utils_1.get_range(this.context.version),
                message: `Package ${this.context.name.value}-${this.context.version.value} is vulnerable: ${cves}`,
                source: 'Component Analysis'
            };
            // TODO: this can be done lazily
            if (this.changeTo != null) {
                let command = {
                    title: "Switch to recommended version " + this.changeTo,
                    command: "lsp.applyTextEdit",
                    arguments: [{ range: diagnostic.range, newText: this.changeTo }]
                };
                diagnostic.message += ". Recommendation: use version " + this.changeTo;
                codeActionsMap[diagnostic.message] = command;
            }
            return [diagnostic];
        }
        else {
            return [];
        }
    }
}
exports.SecurityEngine = SecurityEngine;
;
let codeActionsMap = new Map();
exports.codeActionsMap = codeActionsMap;
//# sourceMappingURL=consumers.js.map