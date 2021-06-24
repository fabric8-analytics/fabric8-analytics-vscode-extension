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

export function goWithVulnsUITest() {
    describe('UI tests for go manifest file with vulns', () => {
        let driver: WebDriver;
        let homedir: string;
        const dir = path.resolve("./manifests");
        let folderName = "manifests"
        let fileName = "go.mod"
        before(async function () {
            driver = VSBrowser.instance.driver;
            homedir = dir
        });

        after(function () {
            this.timeout(10000)
        })

        describe('open manifest file', () => {
            openManifestFile(folderName, fileName);
        });

        if (os.type() == 'Linux') {
            describe('check CA in editor', () => {
                let rowNo = 7;
                let colNo = 43;
                checkCAInEditor(folderName, fileName, rowNo, colNo);
            });
        }

        delay(5000)

        describe('trigger SA report', () => {
            describe('from notification', () => {
                triggerNotification(folderName, fileName);
                delay(500)
            });

            describe('from statusbar', () => {
                triggerStatusBar(folderName, fileName);
                delay(500)
            });

            describe('from PIE btn', () => {
                triggerPIEbtn(folderName, fileName);
                delay(500)
            });

            delay(2000)
        });

        describe('clear Editor', closeAllFilesInEditor);

    });
};
