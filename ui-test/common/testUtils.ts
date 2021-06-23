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

function openManifestFile(folderName, fileName) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);
    let isTarget = false;
    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    if (fileName == "go.mod") {
        it('execute vendor cmd', async function () {
            const bottomBar = new BottomBarPanel();
            const terminalView = await bottomBar.openTerminalView();
            await terminalView.executeCommand('go mod vendor');
            setTimeout(() => {
                terminalView.executeCommand('go mod tidy');
            }, 5000)
            expect(terminalView).to.not.be.undefined;
        }).timeout(10000);

        delay(3000)
    }

    it('open manifest file', async function () {
        await driver.wait(until.elementLocated(By.className('monaco-workbench')), 6000);
        await new Promise(cb => setTimeout(cb, 2000))
        const section = await new SideBarView().getContent().getSection('Untitled (Workspace)');
        const title = section.getTitle();
        await section.expand();
        await section.openItem(folderName, fileName);
        expect(title).not.to.be.null;
    }).timeout(10000);

    delay(6000)

    it('confirm that manifest file opened in editor', async function () {
        await new Promise(cb => setTimeout(cb, 6000))
        const editorView = new EditorView();
        const titles = await editorView.getOpenEditorTitles();
        let len = titles.length;
        let present = false;
        for (let i = 0; i < len; i++) {
            if (titles[i] == fileName) {
                present = true;
                break;
            }
        }
        expect(present).equals(true);
    }).timeout(10000);

    delay(8000)

    it('close any extension tab and any other tab if opened', async function () {
        await new Promise(cb => setTimeout(cb, 2000))
        const editorView = new EditorView();
        const titles = await editorView.getOpenEditorTitles();
        let len = titles.length;
        let present = false;
        for (let i = 0; i < len; i++) {
            if (titles[i] != fileName) {
                await editorView.closeEditor(titles[i]);
            }
        }
        expect(len).to.not.equal(0);
    }).timeout(10000);

    delay(2000)
}

function checkCAInEditor(folderName, fileName, rowNo, colNo) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    it('move pointer to vuln location', async function () {
        const editor = new TextEditor();
        await editor.typeText(rowNo, colNo, '');
        expect(editor).to.not.be.undefined;
    }).timeout(10000);

    delay(5000)

    it('check and click on bulb', async function () {
        const editor = new TextEditor();
        let element = await driver.findElement(By.className("codicon-light-bulb codicon"))
        await element.click();
        expect(element).to.not.be.undefined;
    }).timeout(10000);

    delay(3000)

    it('move cursor and hide bulb', async function () {
        const editor = new TextEditor();
        await editor.typeText(1, 1, '');
        expect(editor).to.not.be.undefined;
    }).timeout(10000);

    delay(2000)

    it('check problems view is not empty', async function () {
        const bottomBarPanel = new BottomBarPanel()
        const problemsView = await bottomBarPanel.openProblemsView();
        const markers = await problemsView.getAllMarkers(MarkerType.Any);
        await bottomBarPanel.toggle(false);
        let len = markers.length;
        expect(len).to.not.equal(0);
    }).timeout(10000);

    delay(2000)
}

function checkForDetailedReportAndTargetFolder(folderName, fileName) {
    let driver: WebDriver;
    let browser: VSBrowser;
    let homedir: string;
    const dir = path.resolve("./" + folderName);

    before(async function () {
        driver = VSBrowser.instance.driver;
        browser = VSBrowser.instance;
        homedir = dir
    });

    it('check for detailed report', async function () {
        const editorView = new EditorView();
        const titles = await editorView.getOpenEditorTitles();
        let len = titles.length;
        let present = false;
        for (let i = 0; i < len; i++) {
            if (titles[i] == "Dependency Analytics Report") {
                present = true;
                break;
            }
        }
        try {
            const webview = new WebView();
            await webview.switchToFrame();
            const element = await webview.findWebElement(By.tagName("html"));
            await webview.switchBack();
            expect(element).to.not.be.undefined;
        }
        catch (err) {
            log("error detected : " + err)
            assert.fail("empty webview")
        }

        expect(present).equals(true);
    }).timeout(10000);

    delay(2000)

    it('close all tabs except manifest file', async function () {
        const editorView = new EditorView();
        const titles = await editorView.getOpenEditorTitles();
        let len = titles.length;
        for (let i = 0; i < len; i++) {
            if (titles[i] != fileName) {
                await editorView.closeEditor(titles[i]);
            }
        }
        expect(len).to.not.equal(0);
    }).timeout(10000);

    delay(2000)

    it('delete target folder if created', async function () {
        const targetdir = path.resolve("./" + folderName + "/target");
        if (fs.existsSync(targetdir)) {
            fs.rmdirSync(targetdir, { recursive: true });
        }
        assert.ok(true)
    }).timeout(10000);

    delay(2000)
}

function closeAllFilesInEditor() {
    it('close all tabs in Editor', async function () {
        await new EditorView().closeAllEditors();
        const editorView = new EditorView();
        const titles = await editorView.getOpenEditorTitles();
        let len = titles.length;
        expect(len).to.equal(0);
    }).timeout(10000);

    delay(2000)
}

export {
    openManifestFile,
    checkCAInEditor,
    checkForDetailedReportAndTargetFolder,
    closeAllFilesInEditor
};