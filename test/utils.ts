import * as babelCore from "@babel/core";
import * as fs from "fs";

async function dynamicImportProvider(path) {
    return await import(path)
}

/**
 *
 * @param path
 * @return providerInstance - provider instance that exposing private method/functions/properties to be mocked/stubbed
 */
export function rewireProvider(path) {
    let providerBuffeer = fs.readFileSync(path + ".js")
    let providerSource = babelCore.transform(providerBuffeer, { plugins: ["babel-plugin-rewire"] }).code;
    fs.writeFileSync(path + "_rewire.js", providerSource)
    return dynamicImportProvider("../../" + path + "_rewire.js")
}