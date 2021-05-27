import { BottomBarPanel, By, EditorView, MarkerType, NotificationType, SideBarView, StatusBar, TextEditor, until, VSBrowser, WebDriver, WebView, Workbench } from "vscode-extension-tester";
import { delay } from "../common/helperUtils";
import { expect } from 'chai';
var fs = require('fs');
var assert = require('assert');
import debug from 'debug'
import { checkCAInEditor, checkForDetailedReportAndTargetFolder, closeAllFilesInEditor, openManifestFile } from "../common/testUtils";
import { triggerNotification, triggerPIEbtn, triggerStatusBar } from "../common/subTestUtils";
const log = debug('server');
let path = require('path');
let os = require('os');
const request = require('supertest');

export function pypiWithVulnsUITest() {
    describe('UI tests for pypi manifest file with vulns', () => {
        let driver: WebDriver;
        let browser: VSBrowser;
        let homedir: string;
        const dir = path.resolve("./manifests");
        let folderName = "manifests"
        let fileName = "requirements.txt"
        before(async function () {
            driver = VSBrowser.instance.driver;
            browser = VSBrowser.instance;
            homedir = dir
        });

        after(function () {
            this.timeout(10000) // 10 second timeout for setup
        })

        // delay(2000)

        describe('open manifest file', () => {
            openManifestFile(folderName, fileName);
        });


        describe('check CA in editor', () => {
            let rowNo = 1;
            let colNo = 12;
            checkCAInEditor(folderName, fileName, rowNo, colNo);
        });

        describe('trigger SA report', () => {
            describe('from notification', () => {
                // 1. Notification
                triggerNotification(folderName, fileName);
                delay(500)
            });

            describe('from statusbar', () => {
                // 2. Statusbar
                triggerStatusBar(folderName, fileName);
                delay(500)
            });

            describe('from PIE btn', () => {
                // 3. Titlebar
                triggerPIEbtn(folderName, fileName);
                delay(500)
            });

            delay(2000)
        });

        describe('clear Editor', closeAllFilesInEditor);

    });
};
