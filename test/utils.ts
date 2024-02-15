import * as babelCore from "@babel/core";
import * as fs from "fs";

/**
 * Asynchronously imports a module.
 * 
 * @param filepath Path to the module to be imported.
 * @returns A promise that resolves to the module's exports.
 */
async function dynamicImportProvider(filepath) {
    return await import(filepath)
}

/**
 * Rewires a module for testing purposes.
 * @param filepath path to the compiled JavaScript file of the tested module.
 * @return A module instance that exposes private methods/functions/properties to be mocked/stubbed.
 */
export function rewireModule(filepath) {
    let moduleBuffeer = fs.readFileSync(filepath + ".js")
    let moduleSource = babelCore.transform(moduleBuffeer, { plugins: ["babel-plugin-rewire"] }).code;
    fs.writeFileSync(filepath + "_rewire.js", moduleSource)
    return dynamicImportProvider("../../" + filepath + "_rewire.js")
}

/**
 * Removes rewired modules from file system.
 * @param filepath path to the compiled JavaScript file of the tested module.
 */
export function cleanupRewireFiles(filepath) {
    const fileToRemove = filepath + "_rewire.js"
    try {
        fs.unlinkSync(fileToRemove);
    } catch (err) {
        console.error(`Error deleting rewire module ${fileToRemove}: ${err.message}`);
    }
}