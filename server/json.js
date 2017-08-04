/* --------------------------------------------------------------------------------------------
 * Copyright (c) Pavel Odvody 2016
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Since the following modules are written in regular JS we can't use TS's import statement
   so we need to `require` those the JS way */
let Parser = require("stream-json/ClassicParser"), Streamer = require("stream-json/Streamer"), Emitter = require("stream-json/Emitter"), Packer = require("stream-json/Packer");
/* Determine to which class the emitted token belongs */
var TokenMarker;
(function (TokenMarker) {
    TokenMarker[TokenMarker["Invalid"] = 0] = "Invalid";
    TokenMarker[TokenMarker["Key"] = 1] = "Key";
    TokenMarker[TokenMarker["Value"] = 2] = "Value";
})(TokenMarker || (TokenMarker = {}));
;
/* Determine what is the value */
var ValueType;
(function (ValueType) {
    ValueType[ValueType["Invalid"] = 0] = "Invalid";
    ValueType[ValueType["String"] = 1] = "String";
    ValueType[ValueType["Integer"] = 2] = "Integer";
    ValueType[ValueType["Float"] = 3] = "Float";
    ValueType[ValueType["Array"] = 4] = "Array";
    ValueType[ValueType["Object"] = 5] = "Object";
    ValueType[ValueType["Boolean"] = 6] = "Boolean";
    ValueType[ValueType["Null"] = 7] = "Null";
})(ValueType || (ValueType = {}));
exports.ValueType = ValueType;
;
;
;
;
class Variant {
    constructor(type, object) {
        this.type = type;
        this.object = object;
    }
}
exports.Variant = Variant;
class KeyValueEntry {
    constructor(k, pos) {
        this.key = k;
        this.key_position = pos;
    }
}
exports.KeyValueEntry = KeyValueEntry;
class Scope {
    constructor(parent) {
        this.children = [];
        this.properties = [];
        this.parent = parent;
        this.marker = TokenMarker.Invalid;
        this.last = null;
    }
    add_scope() {
        let new_scope = new Scope(this);
        this.children.push(new_scope);
        /* We're creating a new scope, but since the current key has
           undefined value it means the new scope (or the contents therein) *is* the value */
        if (this.last !== null && this.last.value == undefined) {
            this.last.value = new Variant(ValueType.Object, new_scope.properties);
            this.properties.push(this.last);
        }
        return new_scope;
    }
    consume(token) {
        switch (this.marker) {
            case TokenMarker.Key:
                this.last = new KeyValueEntry(token.value, { line: token.line, column: token.pos });
                this.marker = TokenMarker.Invalid;
                break;
            case TokenMarker.Value:
                this.last.value = new Variant(ValueType.String, token.value);
                this.last.value_position = { line: token.line, column: token.pos };
                this.properties.push(this.last);
                this.marker = TokenMarker.Invalid;
                break;
            default:
                break;
        }
    }
    leave() {
        return this.parent;
    }
    /* used mainly for debug purposes */
    print() {
        console.log(this.properties);
        this.children.forEach((scope) => { scope.print(); });
    }
}
;
class StreamingParser {
    constructor(file) {
        this.file = file;
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            let scope = new Scope(), parser = new Parser(), stream = new Streamer(), emitter = new Emitter(), packer = new Packer({ packKeys: true, packStrings: true, packNumbers: true });
            let root = scope;
            /* In the following code we observe two event streams, one defined by parser
            and the other one by emitter. The difference here is that parser produces raw tokens
            with positional information as to where in the file the token is declared, but since
            this stream is very low level and contains tokens like ", [, ] etc. we need to correlate
            events from this stream with the events produced by the emitter stream which gives
            us much finer granularity in handling the underlying JSON structure.
            
            The correlation of the events itself is handled by the `Scope` which in essence
            implements a finite state machine to make sense of the two event streams. */
            parser.on("data", function (x) {
                if (scope.marker != TokenMarker.Invalid) {
                    scope.consume(x);
                }
            });
            parser.on("error", function (e) {
                // the JSON document doesn't have to be well-formed, that's fine
            });
            emitter.on("startKey", function () { scope.marker = TokenMarker.Key; });
            /* We don't care about numbers, nulls, arrays and booleans thus far */
            emitter.on("startString", function () { scope.marker = TokenMarker.Value; });
            emitter.on("startObject", function () { scope = scope.add_scope(); });
            emitter.on("endObject", function () { scope = scope.leave(); });
            this.file
                .pipe(parser)
                .pipe(stream)
                .pipe(packer)
                .pipe(emitter);
            return new Promise(resolve => {
                emitter.on("finish", () => resolve(root));
            });
        });
    }
}
exports.StreamingParser = StreamingParser;
;
//# sourceMappingURL=json.js.map