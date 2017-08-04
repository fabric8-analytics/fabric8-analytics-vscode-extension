/* --------------------------------------------------------------------------------------------
 * Copyright (c) Pavel Odvody 2016
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode_languageserver_1 = require("vscode-languageserver");
const utils_1 = require("./utils");
const collector_1 = require("./collector");
const consumers_1 = require("./consumers");
const sentiment_1 = require("./sentiment");
const stackanalysis_1 = require("./stackanalysis");
const url = require('url');
const https = require('https');
const http = require('http');
const request = require('request');
const winston = require('winston');
winston.level = 'debug';
winston.add(winston.transports.File, { filename: 'bayesian.log' });
winston.remove(winston.transports.Console);
winston.info('Starting Bayesian');
/*
let log_file = fs.openSync('file_log.log', 'w');
let _LOG = (data) => {
    fs.writeFileSync('file_log.log', data + '\n');
}
*/
class AShowMessageParamsInstance {
    constructor(type, message) {
        this.type = type;
        this.message = message;
    }
}
var EventStream;
(function (EventStream) {
    EventStream[EventStream["Invalid"] = 0] = "Invalid";
    EventStream[EventStream["Diagnostics"] = 1] = "Diagnostics";
    EventStream[EventStream["CodeLens"] = 2] = "CodeLens";
})(EventStream || (EventStream = {}));
;
let connection = null;
/* use stdio for transfer if applicable */
if (process.argv.indexOf('--stdio') == -1)
    connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
else
    connection = vscode_languageserver_1.createConnection();
let documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
let workspaceRoot;
connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            codeActionProvider: true
        }
    };
});
;
;
;
class AnalysisFileHandler {
    constructor(matcher, stream, callback) {
        this.stream = stream;
        this.callback = callback;
        this.matcher = new RegExp(matcher);
    }
}
;
class AnalysisFiles {
    constructor() {
        this.handlers = [];
        this.file_data = new Map();
    }
    on(stream, matcher, cb) {
        this.handlers.push(new AnalysisFileHandler(matcher, stream, cb));
        return this;
    }
    run(stream, uri, file, contents) {
        for (let handler of this.handlers) {
            if (handler.stream == stream && handler.matcher.test(file)) {
                return handler.callback(uri, file, contents);
            }
        }
    }
}
;
;
class AnalysisLSPServer {
    constructor(connection, files) {
        this.connection = connection;
        this.files = files;
    }
    handle_file_event(uri, contents) {
        let path_name = url.parse(uri).pathname;
        let file_name = path.basename(path_name);
        this.files.file_data[uri] = contents;
        this.files.run(EventStream.Diagnostics, uri, file_name, contents);
    }
    handle_code_lens_event(uri) {
        let path_name = url.parse(uri).pathname;
        let file_name = path.basename(path_name);
        let lenses = [];
        let contents = this.files.file_data[uri];
        return this.files.run(EventStream.CodeLens, uri, file_name, contents);
    }
}
;
;
class Aggregator {
    constructor(items, callback) {
        this.callback = callback;
        this.mapping = new Map();
        for (let item of items) {
            this.mapping.set(item, false);
        }
    }
    is_ready() {
        let val = true;
        for (let m of this.mapping.entries()) {
            val = val && m[1];
        }
        return val;
    }
    aggregate(dep) {
        this.mapping.set(dep, true);
        if (this.is_ready()) {
            this.callback();
        }
    }
}
;
class AnalysisConfig {
    constructor() {
        // TODO: this needs to be configurable
        this.server_url = "https://recommender.api.openshift.io/api/v1";
        this.api_token = process.env.RECOMMENDER_API_TOKEN || "the-token";
        this.forbidden_licenses = [];
        this.no_crypto = false;
        this.home_dir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
}
;
let config = new AnalysisConfig();
let files = new AnalysisFiles();
let server = new AnalysisLSPServer(connection, files);
let rc_file = path.join(config.home_dir, '.analysis_rc');
if (fs.existsSync(rc_file)) {
    let rc = JSON.parse(fs.readFileSync(rc_file, 'utf8'));
    if ('server' in rc) {
        config.server_url = `${rc.server}/api/v1`;
    }
}
let DiagnosticsEngines = [consumers_1.SecurityEngine];
let DiagnosticsEnginesSenti = [sentiment_1.SecurityEngineSenti];
let DiagnosticsEnginesStack = [stackanalysis_1.SecurityEngineStack];
// TODO: in-memory caching only, this needs to be more robust
let metadataCache = new Map();
let get_metadata = (ecosystem, name, version, cb) => {
    let cacheKey = ecosystem + " " + name + " " + version;
    let metadata = metadataCache[cacheKey];
    if (metadata != null) {
        winston.info('cache hit for ' + cacheKey);
        cb(metadata);
        return;
    }
    let part = [ecosystem, name, version].join('/');
    const options = url.parse(config.server_url);
    options['path'] += `/component-analyses/${part}/`;
    options['headers'] = { 'Authorization': 'Bearer ' + config.api_token };
    winston.debug('get ' + ecosystem + options['host'] + options['path']);
    //connection.console.log('get comp ana' + options['host'] + options['path']);
    //winston.debug('token ' + config.api_token);
    https.get(options, function (res) {
        let body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            winston.info('status ' + ecosystem + this.statusCode);
            if (this.statusCode == 200 || this.statusCode == 202) {
                let response = JSON.parse(body);
                winston.debug('response ' + ecosystem + response);
                //connection.console.log('response comp analysis' + response);
                metadataCache[cacheKey] = response;
                cb(response);
            }
            else {
                cb(null);
            }
        });
    }).on('error', function (e) {
        winston.info("Got error: " + e.message);
    });
};
let sentiment_api_call = (ecosystem, name, version, cb) => {
    http.get("http://sentiment-http-sentiment-score.dev.rdu2c.fabric8.io/api/v1.0/getsentimentanalysis/?package=" + name, function (res) {
        let body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            winston.info('status ' + this.statusCode);
            if (this.statusCode == 200 || this.statusCode == 202) {
                let response = JSON.parse(body);
                winston.debug('response ' + response);
                //metadataCache[cacheKey] = response;
                cb(response);
            }
            else {
                cb(null);
            }
        });
    }).on('error', function (e) {
        winston.info("Got error: " + e.message);
    });
};
let pollFunc = (fn, id, timeout, interval, cb) => {
    let startTime = (new Date()).getTime();
    interval = interval || 20000;
    //let canPoll = true;
    (function p() {
        //canPoll = ((new Date).getTime() - startTime) <= timeout;
        fn(id, p, (response) => {
            if (response) {
                cb(response);
            }
            else {
                setTimeout(p, 20000);
            }
        });
    })();
};
let makeStackAnalysisCall = (id, p, callbk) => {
    if (id) {
        const options = url.parse("http://bayesian-api-bayesian-preview.b6ff.rh-idev.openshiftapps.com");
        options['path'] += "/api/v1/stack-analyses-v2/" + id;
        options['headers'] = { 'Authorization': 'Bearer ' + '' };
        http.get(options, function (res) {
            let body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                winston.info('status ' + this.statusCode);
                if (this.statusCode == 200 || this.statusCode == 202) {
                    let response = JSON.parse(body);
                    if (response.hasOwnProperty("error")) {
                        winston.debug("stack-analyses-v2 in progress!!");
                        callbk(null);
                    }
                    else {
                        winston.debug('response stack-analyses-v2' + response.result[0].user_stack_info.dependencies);
                        callbk(response.result[0].user_stack_info.dependencies);
                    }
                }
                else {
                    winston.debug("repeat!!");
                    callbk(null);
                }
            });
        }).on('error', function (e) {
            winston.info("Got error[stack-analyses-v2]: " + e.message);
            callbk(null);
        });
    }
};
let stack_analysis_call_file_upload = (filename, contents, contentType, cb) => {
    //const options = url.parse(config.server_url);
    //options['method'] = 'POST';
    //options['uri'] = config.server_url +`/stack-analyses/`;
    //options['headers'] = {'Authorization': 'Bearer ' + config.api_token};
    const options = {};
    options['uri'] = "http://bayesian-api-bayesian-preview.b6ff.rh-idev.openshiftapps.com/api/v1/stack-analyses-v2";
    options['headers'] = { 'Authorization': 'Bearer ' + '' };
    winston.debug('post file upload' + options['uri']);
    var req = request.post(options, function (err, resp, body) {
        if (err) {
            cb(null);
            winston.info("Got error file upload[stack-analyses-v2]: " + err);
        }
        else {
            var k = JSON.parse(body);
            cb(k.id);
        }
    });
    var form = req.form();
    //form.append('manifest[]', fs.createReadStream(filename));
    form.append('manifest[]', contents, {
        filename: filename,
        contentType: contentType
    });
};
files.on(EventStream.Diagnostics, "^package\\.json$", (uri, name, contents) => {
    /* Convert from readable stream into string */
    let stream = utils_1.stream_from_string(contents);
    let collector = new collector_1.DependencyCollector(null);
    collector.collect(stream).then((deps) => {
        let diagnostics = [];
        /* Aggregate asynchronous requests and send the diagnostics at once */
        let aggregator = new Aggregator(deps, () => {
            connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
        });
        for (let dependency of deps) {
            get_metadata('npm', dependency.name.value, dependency.version.value, (response) => {
                if (response != null) {
                    let pipeline = new consumers_1.DiagnosticsPipeline(DiagnosticsEngines, dependency, config, diagnostics);
                    pipeline.run(response);
                }
                aggregator.aggregate(dependency);
            });
            //TODO :: sentiment analysis
            // sentiment_api_call('npm', dependency.name.value, dependency.version.value, (response) => {
            //     if (response != null) {
            //         let pipeline = new DiagnosticsPipelineSenti(DiagnosticsEnginesSenti, dependency, config, diagnostics);
            //         pipeline.run(response);
            //     }
            //     aggregator.aggregate(dependency);
            // });
        }
    });
});
files.on(EventStream.Diagnostics, "^pom\\.xml$", (uri, name, contents) => {
    /* Convert from readable stream into string */
    let stream = utils_1.stream_from_string(contents);
    connection.console.log('mvn stream' + stream);
    let collector = new collector_1.PomXmlDependencyCollector();
    collector.collect(stream).then((deps) => {
        let diagnostics = [];
        /* Aggregate asynchronous requests and send the diagnostics at once */
        let aggregator = new Aggregator(deps, () => {
            connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
        });
        for (let dependency of deps) {
            //connection.console.log('mvn cmp name'+ dependency.name.value);
            get_metadata('maven', dependency.name.value, dependency.version.value, (response) => {
                if (response != null) {
                    let pipeline = new consumers_1.DiagnosticsPipeline(DiagnosticsEngines, dependency, config, diagnostics);
                    pipeline.run(response);
                }
                aggregator.aggregate(dependency);
            });
            //winston.debug('on file ');
            // sentiment_api_call('maven', dependency.name.value, dependency.version.value, (response) => {
            //     if (response != null) {
            //         let pipeline = new DiagnosticsPipelineSenti(DiagnosticsEnginesSenti, dependency, config, diagnostics);
            //         pipeline.run(response);
            //     }
            //     aggregator.aggregate(dependency);
            // });
        }
    });
});
let stackID;
files.on(EventStream.Diagnostics, "^requirements\\.txt$", (uri, name, contents) => {
    let collector = new collector_1.ReqDependencyCollector();
    let StackArr = [];
    let triggerDiagnosticAggregation = () => {
        collector.collect(contents).then((deps) => {
            let diagnostics = [];
            /* Aggregate asynchronous requests and send the diagnostics at once */
            let aggregator = new Aggregator(deps, () => {
                connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
            });
            for (let dependency of deps) {
                get_metadata('pypi', dependency.name.value, dependency.version.value, (response) => {
                    if (response != null) {
                        let pipeline = new consumers_1.DiagnosticsPipeline(DiagnosticsEngines, dependency, config, diagnostics);
                        pipeline.run(response);
                    }
                    aggregator.aggregate(dependency);
                });
                // sentiment_api_call('pypi', dependency.name.value, dependency.version.value, (response) => {
                //     if (response != null) {
                //         let pipeline = new DiagnosticsPipelineSenti(DiagnosticsEnginesSenti, dependency, config, diagnostics);
                //         pipeline.run(response);
                //     }
                //     aggregator.aggregate(dependency);
                // });
                // if(StackArr.length>0){
                //     //connection.console.log("dep name ===> "+dependency.name.value);
                //     form_stack_data(dependency.name.value, StackArr, (response) => {
                //         if (response != null) {
                //             let aShowMessageParamsInstance = new AShowMessageParamsInstance(3,"Stack analysis is processed successfully!!");
                //             connection.sendNotification(ShowMessageNotification.type,aShowMessageParamsInstance);
                //             let pipeline = new DiagnosticsPipelineStack(DiagnosticsEnginesStack, dependency, config, diagnostics);
                //             pipeline.run(response);
                //         }
                //         aggregator.aggregate(dependency);    
                //     });                
                // }
            }
        });
    };
    // if(stackID){
    //     StackArr = [];
    //     stackID = false;
    //     stack_analysis_call_file_upload("requirements.txt", contents, "text/plain" ,(response) => {
    //         stackID = true;
    //         if (response != null) {
    //             StackArr = [];
    //             stackID = false;
    //             let aShowMessageParamsInstance = new AShowMessageParamsInstance(3,"Stack analysis triggerd for "+response);
    //             connection.sendNotification(ShowMessageNotification.type,aShowMessageParamsInstance);
    //             pollFunc(makeStackAnalysisCall, response, 95000, 20000, (response) => {
    //                 StackArr = response;
    //                 triggerDiagnosticAggregation();
    //             });
    //         }
    //     });
    // }
    triggerDiagnosticAggregation();
});
let form_stack_data = (dependency, stackArr, cb) => {
    for (var i = 0; i < stackArr.length; i++) {
        if (stackArr[i].name == dependency) {
            cb(stackArr[i]);
        }
    }
    cb(null);
};
let checkDelay;
connection.onDidSaveTextDocument((params) => {
    winston.debug('on save ' + params.textDocument.uri);
    clearTimeout(checkDelay);
    server.handle_file_event(params.textDocument.uri, server.files.file_data[params.textDocument.uri]);
});
connection.onDidChangeTextDocument((params) => {
    winston.debug('on change ' + params.textDocument.uri);
    /* Update internal state for code lenses */
    server.files.file_data[params.textDocument.uri] = params.contentChanges[0].text;
    server.handle_file_event(params.textDocument.uri, server.files.file_data[params.textDocument.uri]);
    clearTimeout(checkDelay);
    checkDelay = setTimeout(() => {
        server.handle_file_event(params.textDocument.uri, server.files.file_data[params.textDocument.uri]);
    }, 500);
});
connection.onDidOpenTextDocument((params) => {
    winston.debug('on file open ' + params.textDocument.uri);
    stackID = true;
    server.handle_file_event(params.textDocument.uri, params.textDocument.text);
});
connection.onCodeAction((params, token) => {
    clearTimeout(checkDelay);
    let commands = [];
    for (let diagnostic of params.context.diagnostics) {
        let command = consumers_1.codeActionsMap[diagnostic.message];
        if (command != null) {
            commands.push(command);
        }
    }
    return commands;
});
connection.onDidCloseTextDocument((params) => {
    clearTimeout(checkDelay);
});
connection.listen();
//# sourceMappingURL=server.js.map