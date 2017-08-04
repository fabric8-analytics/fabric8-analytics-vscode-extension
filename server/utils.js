/* --------------------------------------------------------------------------------------------
 * Copyright (c) Pavel Odvody 2016
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
exports.stream_from_string = (s) => {
    let stream = new stream_1.Readable();
    stream.push(s);
    stream.push(null);
    return stream;
};
/* VSCode and Che transmit the file buffer in a different manner,
 * so we have to use different functions for computing the
 * positions and ranges so that the lines are rendered properly.
 */
let _to_lsp_position_vscode = (pos) => {
    return { line: pos.line / 2, character: pos.column - 1 };
};
let _get_range_vscode = (ps) => {
    let length = ps.value.length;
    return {
        start: exports.to_lsp_position(ps.position),
        end: { line: ps.position.line / 2, character: ps.position.column + length - 1 }
    };
};
let _to_lsp_position_che = (pos) => {
    return { line: pos.line - 1, character: pos.column - 1 };
};
let _get_range_che = (ps) => {
    let length = ps.value.length;
    return {
        start: exports.to_lsp_position(ps.position),
        end: { line: ps.position.line - 1, character: ps.position.column + length - 1 }
    };
};
exports.to_lsp_position = (pos) => {
    return _to_lsp_position_che(pos);
};
exports.get_range = (ps) => {
    return _get_range_che(ps);
};
//# sourceMappingURL=utils.js.map