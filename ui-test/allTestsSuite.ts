import { VSBrowser, WebDriver, SideBarView, ActivityBar, EditorView, By, WebView, TextEditor, Workbench, NotificationType } from "vscode-extension-tester";
import { expect } from 'chai';
import { addFolderToWorkspace, removeFolderFromWorkspace } from "./common/commonUtils";
let path = require('path');
var fs = require('fs');
let os = require('os');
import debug from 'debug'
const log = debug('server');
import { checkPIEBTN, checkStatusBarBTN } from "./common/negativeTests";
import { testWithoutVulns, testWithVulns } from "./common/mainTestUtils";
import { changeWorkspace, checkWorkspaceSection } from "./common/workspaceUtils";
var assert = require('assert');

describe('UI tests', function () {
    let driver: WebDriver;
    let homedir: string;
    let dir = path.resolve("./manifests");
    before(async function () {
        driver = VSBrowser.instance.driver;
        homedir = dir
        const control = await new ActivityBar().getViewControl('Explorer');
        const explorerView = await control.openView();
        addFolderToWorkspace(homedir);
    });

    describe('checking workspace section', checkWorkspaceSection);

    describe('negative test 1: statusbar btn absent before opening manifest file', checkStatusBarBTN);

    describe('test with vulns', testWithVulns);

    describe('change workspace', changeWorkspace);

    describe('test without vulns', testWithoutVulns);

    describe('negative test 3 : PIE btn absent after closing manifest file', checkPIEBTN);

    after(async function () {
        await new Promise(cb => setTimeout(cb, 1500));
    });
});