import { VSBrowser, WebDriver, SideBarView, ActivityBar, EditorView, By, WebView, TextEditor, Workbench, NotificationType } from "vscode-extension-tester";
import { expect } from 'chai';
import { addFolderToWorkspace, removeFolderFromWorkspace } from "./common/commonUtils";
let path = require('path');
import { pypiWithVulnsUITest } from './manifestFileTests/pypiWithVulns';
import { pypiWithoutVulnsUITest } from './manifestFileTests/pypiWithoutVulns';
import { npmWithVulnsUITest } from './manifestFileTests/npmWithVulns';
import { npmWithoutVulnsUITest } from "./manifestFileTests/npmWithoutVulns";
var fs = require('fs');
let os = require('os');
import debug from 'debug'
const log = debug('server');
import { delay } from "./common/helperUtils";
import { goWithoutVulnsUITest } from "./manifestFileTests/goWithoutVulns";
import { mavenWithoutVulnsUITest } from "./manifestFileTests/mavenWithoutVulns";
import { goWithVulnsUITest } from "./manifestFileTests/goWithVulns";
import { mavenWithVulnsUITest } from "./manifestFileTests/mavenWithVulns";
import { checkPIEBTN, checkStatusBarBTN } from "./common/negativeTests";
var assert = require('assert');

describe('Fabric8-Analytics-VSCode-Extension UI tests', function () {
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

    describe('checking workspace section', function () {
        it('workspace sections should not be null for manifests', async function () {
            this.timeout(5000);
            const sections = new SideBarView().getContent().getSections();
            expect(sections).not.to.be.null;
        })
    });

    describe('negative test 1 : statusbar btn absent before opening manifest file', checkStatusBarBTN)

    describe('pypi tests with vulns', pypiWithVulnsUITest)
    describe('npm tests with vulns', npmWithVulnsUITest)
    describe('go tests with vulns', goWithVulnsUITest)
    describe('maven tests with vulns', mavenWithVulnsUITest)

    describe('change workspace', function () {
        it('remove manifests folder from workspace and add manifest1 folder', async function () {
            dir = path.resolve("./manifests1");
            homedir = dir
            // const control = await new ActivityBar().getViewControl('Explorer');
            // const explorerView = await control.openView();
            addFolderToWorkspace(homedir);
            removeFolderFromWorkspace(path.resolve("./manifests"))
        });

        it('workspace sections should not be null for manifests', async function () {
            this.timeout(5000);
            const sections = new SideBarView().getContent().getSections();
            expect(sections).not.to.be.null;
        })

        delay(2000);
    });

    describe('pypi tests without vulns', pypiWithoutVulnsUITest);
    describe('npm tests without vulns', npmWithoutVulnsUITest);
    describe('go tests without vulns', goWithoutVulnsUITest);
    describe('maven tests without vulns', mavenWithoutVulnsUITest);

    describe('negative test 3 : PIE btn absent after closing manifest file', checkPIEBTN)

    describe('after tests', function () {
        delay(2000);

        it('assert true', async function () {
            assert.ok(true);
        })

        delay(2000);
    });

    after(async function (done) {
        done();
    });
});