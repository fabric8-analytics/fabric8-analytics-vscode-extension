import { BottomBarPanel, By, EditorView, MarkerType, NotificationType, SideBarView, StatusBar, TextEditor, until, VSBrowser, WebDriver, WebView, Workbench } from "vscode-extension-tester";
import { delay } from "../common/helperUtils";
import { expect } from 'chai';
var fs = require('fs');
var assert = require('assert');
import debug from 'debug'
import { addFolderToWorkspace, removeFolderFromWorkspace } from "./commonUtils";
const log = debug('server');
let path = require('path');
let os = require('os');
const request = require('supertest');

function checkWorkspaceSection() {
    let driver: WebDriver;
    let browser: VSBrowser;

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
    });

    it('workspace sections should not be empty', async function () {
        this.timeout(5000);
        const sections = new SideBarView().getContent().getSections();
        expect(sections).not.to.be.null;
    })
}

function changeWorkspace() {
    let driver: WebDriver;
    let browser: VSBrowser;

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
    });

    it('remove manifests folder from workspace and add manifest1 folder', async function () {
        addFolderToWorkspace(path.resolve("./manifests1"));
        removeFolderFromWorkspace(path.resolve("./manifests"))
    });

    it('workspace sections should not be empty', async function () {
        this.timeout(5000);
        const sections = new SideBarView().getContent().getSections();
        expect(sections).not.to.be.null;
    })

    delay(2000);
}

export {
    checkWorkspaceSection,
    changeWorkspace
};