import { BottomBarPanel, By, EditorView, MarkerType, NotificationType, SideBarView, StatusBar, TextEditor, until, VSBrowser, WebDriver, WebView, Workbench } from "vscode-extension-tester";
import { delay } from "./helperUtils";
import { expect } from 'chai';
var fs = require('fs');
var assert = require('assert');
import debug from 'debug'
import { checkCAInEditor, checkForDetailedReportAndTargetFolder, openManifestFile } from "./testUtils";
import { checkDependencyNotificationAfterSATrigger } from "./negativeTests";
const log = debug('server');
let path = require('path');
let os = require('os');
const request = require('supertest');

const _time = 60;

function triggerNotification(folderName, fileName) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    describe('click on notification', () => {
        it('from notification', async function () {
            const center = await new Workbench().openNotificationsCenter();
            const notifications = await center.getNotifications(NotificationType.Warning);
            const notification = notifications[0];
            await notification.takeAction('Open the detailed vulnerability report');
            await center.close();
            expect(notification).to.not.be.undefined;
        }).timeout(20000);

        delay(1 * _time * 1000)
    });

    describe('negative test 2 : no notification triggered again', checkDependencyNotificationAfterSATrigger);

    describe('check for detailed report and target folder', () => {
        checkForDetailedReportAndTargetFolder(folderName, fileName);
    });
}

function triggerStatusBar(folderName, fileName) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    describe('click on statusbar', () => {
        it('from statusbar', async function () {
            await driver.findElement(By.id("redhat.fabric8-analytics")).click();
            assert.ok(true)
        }).timeout(20000);

        delay(1 * _time * 1000)
    });

    describe('check for detailed report and target folder', () => {
        checkForDetailedReportAndTargetFolder(folderName, fileName);
    });
}

function triggerPIEbtn(folderName, fileName) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    describe('click on PIE btn', () => {
        it('from PIE btn', async function () {
            await driver.findElement(By.className("action-label icon")).click();
            assert.ok(true)
        }).timeout(20000);

        delay(1 * _time * 1000)
    });

    describe('check for detailed report and target folder', () => {
        checkForDetailedReportAndTargetFolder(folderName, fileName);
    });
}

export {
    triggerNotification,
    triggerStatusBar,
    triggerPIEbtn
}