import { BottomBarPanel, By, EditorView, MarkerType, NotificationType, SideBarView, StatusBar, TextEditor, until, VSBrowser, WebDriver, WebView, Workbench } from "vscode-extension-tester";
import { delay } from "../common/helperUtils";
import { expect } from 'chai';
var fs = require('fs');
var assert = require('assert');
import debug from 'debug'
const log = debug('server');
let path = require('path');
let os = require('os');
const request = require('supertest');

function checkStatusBarBTN() {
    let driver: WebDriver;
    let browser: VSBrowser;

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
    });

    it('confirm statusbar btn is absent', async function () {
        try {
            let element = await driver.findElement(By.id("redhat.fabric8-analytics"));
            assert.fail("statusbar btn is present before manifest file")
        }
        catch (err) {
            assert.ok(true);
        }
    }).timeout(20000);

    delay(2000)
}

function checkPIEBTN() {
    let driver: WebDriver;
    let browser: VSBrowser;

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
    });

    it('confirm PIE btn is absent', async function () {
        try {
            let element = await driver.findElement(By.className("action-label icon"));
            assert.fail("PIE btn is present before manifest file")
        }
        catch (err) {
            assert.ok(true);
        }
    }).timeout(20000);

    delay(2000)
}

function checkDependencyNotificationAfterSATrigger() {
    let driver: WebDriver;
    let browser: VSBrowser;

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
    });

    it('confirm notification is not triggered again', async function () {
        try {
            const center = await new Workbench().openNotificationsCenter();
            const notifications = await center.getNotifications(NotificationType.Warning);
            const notification = notifications[0];
            await notification.takeAction('Open the detailed vulnerability report');
            // await center.clearAllNotifications(); // optional
            assert.fail("notification got triggered again")
        }
        catch (err) {
            const center = await new Workbench().openNotificationsCenter();
            await center.close();
            assert.ok(true);
        }
    }).timeout(20000);

    delay(2000)
}

export {
    checkStatusBarBTN,
    checkPIEBTN,
    checkDependencyNotificationAfterSATrigger
};