import * as fs from 'fs';
import { expect } from 'chai';
import {
    InputBox,
    Key,
    Notification,
    NotificationType,
    QuickPickItem,
    VSBrowser,
    Workbench
} from 'vscode-extension-tester';

let path = require('path');

interface QuickPickWaiterArgs {
    input: InputBox;
    quickPickText: string;
    quickPickGetter?: () => Promise<string>;
    timeout?: number;
    message?: string;
}

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
async function openCommandPrompt(timeout: number = 6000): Promise<InputBox> {
    const driver = VSBrowser.instance.driver;

    return driver.wait(async () => {
        // if cannot interact with vscode, return null
        if (!await VSBrowser.instance.driver.actions().sendKeys(Key.F1).perform().then(() => true).catch(() => false)) {
            return null;
        }
        return new InputBox().wait(750).catch(() => null);
    }, timeout, "Could not open command pallette - timed out") as Promise<InputBox>;
}

async function runCommands(...commands: string[]) {
    const commandPrompt = await openCommandPrompt();
    for (let index = 0; index < commands.length; index++) {
        const command = commands[index];
        await commandPrompt.setText(command);
        await commandPrompt.confirm();
    }
    return commandPrompt;
}

async function waitForQuickPick(args: QuickPickWaiterArgs): Promise<QuickPickItem | undefined> {
    args.message = args.message || "Could not find quick pick";
    const quickPick = await VSBrowser.instance.driver.wait(async () => {
        const quickPicks = await args.input.getQuickPicks();
        const getter = args.quickPickGetter || QuickPickItem.prototype.getText;

        for (const q of quickPicks) {
            if (args.quickPickText === await getter.call(q)) {
                return q;
            }
        }

        return undefined;
    }, args.timeout || 6000, args.message);

    if (quickPick === undefined) {
        expect.fail(args.message);
    }
    else {
        return quickPick;
    }
}

async function verifyQuickPicks(input: InputBox, quickPickValues: string[], quickPickTextGetter = QuickPickItem.prototype.getText as () => Promise<string>, timeout?: number, message?: string): Promise<void> | never {
    const quickPicks = await Promise.all(quickPickValues.map(async (option: string) => {
        return waitForQuickPick({
            input,
            timeout,
            quickPickText: option,
            quickPickGetter: quickPickTextGetter,
            message: `Could not find quick pick with value: ${option}`,
        });
    })).catch(async (e) => {
        throw Error(
            `Could not find quick picks { ${quickPickValues.join(', ')} }
         in { ${(await Promise.all((await input.getQuickPicks()).map(async (q) => await q.getText()))).join(', ')} }.
        Error: ${e}`
        );
    }
    );
    expect(quickPicks.length,
        `Quick pick menu does not have ${quickPickValues.length} entires. Actual number of entries: ${quickPicks.length}`)
        .to.be.equal(quickPickValues.length);
}

async function typeCommandConfirm(command: string, quickPickTextGetter?: () => Promise<string>, quickPickTimeout?: number) {
    if (!command.startsWith(">")) {
        command = ">" + command;
    }

    const prompt = await InputBox.create();
    await prompt.setText(command);
    if (quickPickTextGetter) {
        const quickPickText = command.substring(1);
        const quickPick = await waitForQuickPick({
            input: prompt,
            quickPickText,
            quickPickGetter: quickPickTextGetter,
            timeout: quickPickTimeout
        });
        if (quickPick) {
            await quickPick.select();
        } else {
            throw Error('QuickPick item does not exist for command' + command);
        }
    }
    else {
        await prompt.confirm();
    }
}

async function getCommandPromptOptions(command: string) {
    const commandPrompt = await InputBox.create();
    await commandPrompt.setText(command);
    const options = await commandPrompt.getQuickPicks();
    return convertArrayObjectsToText<QuickPickItem>(options);
}

async function convertArrayObjectsToText<T extends QuickPickItem>(array: T[]) {
    let options = [];
    for (let index = 0; index < array.length; index++) {
        const element = await array[index].getLabel();
        options.push(element.toString());
    }
    return options;
}

async function convertArrayObjectsToTextAndDescription<T extends QuickPickItem>(array: T[]) {
    let options = [];
    for (let index = 0; index < array.length; index++) {
        const label = await array[index].getLabel();
        const description = await array[index].getDescription();
        // const description = await array[index].findElement(By.className("label-description")).getText();
        options.push(label + " " + description);
    }
    return options;
}

async function getIndexOfQuickPickItem(fulltext: string, array: QuickPickItem[]) {
    let index = -1;
    for (let item of array) {
        const text = await item.getLabel();
        const description = await item.getDescription();
        if (fulltext === text + " " + description) {
            return item.getIndex();
        }
    }
    return index;
}

async function convertScrollableQuickPicksToTextAndDescription(input: InputBox) {
    let options = new Set();
    const quickPicks = await input.getQuickPicks();
    quickPicks.map(async pick => {
        options.add(await pick.getLabel() + " " + await pick.getDescription());
    });
    let actualLength = quickPicks.length;
    while (true) {
        const quickPick = await input.findQuickPick(actualLength);
        if (quickPick) {
            options.add(await quickPick.getLabel() + " " + await quickPick.getDescription());
            actualLength++;
        } else {
            break;
        }
    }
    return Array.from(options);
}

async function getAllQuickPickItems(input: InputBox): Promise<QuickPickItem[]> {
    let resultArray = new Set<QuickPickItem>();
    const quickPicks = await input.getQuickPicks();
    quickPicks.map(pick => resultArray.add(pick));
    let actualLength = quickPicks.length;
    while (true) {
        const quickPick = await input.findQuickPick(actualLength);
        if (quickPick) {
            resultArray.add(quickPick);
            actualLength++;
        } else {
            break;
        }
    }
    return Array.from(resultArray);
}

async function notificationExists(text: string, timeout: number = 6000): Promise<Notification> {
    return VSBrowser.instance.driver.wait(async () => {
        const center = await new Workbench().openNotificationsCenter();
        const notifications = await center.getNotifications(NotificationType.Any).catch(() => []);
        for (const notification of notifications) {
            const message = await notification.getMessage().catch(() => null);
            if (message?.includes(text) && await notification.isDisplayed()) {
                return notification;
            }
        }
        return undefined;
    }, timeout) as Promise<Notification>;
}

async function removeFolderFromWorkspace(dir: string) {
    await openCommandPrompt();
    await typeCommandConfirm(">Workspaces: Remove Folder from workspace", QuickPickItem.prototype.getLabel);
    const input = await InputBox.create();
    let dirs = await convertArrayObjectsToText(await input.getQuickPicks());
    if (dirs.filter(item => { return item.indexOf(dir) === 0; }).length === 0) {
        throw Error("Folder " + dir + " is not set as workspace, cannot be removed, available folders: " + dirs);
    }
    await input.selectQuickPick(dir);
}

async function addFolderToWorkspace(dir: string) {
    await openCommandPrompt();
    const quick = await InputBox.create();
    await quick.setText(">Extest: Add Folder");
    await quick.confirm();
    let confirmedPrompt = await InputBox.create();
    await confirmedPrompt.setText(dir);
    await confirmedPrompt.confirm();
}

function removeFilePathRecursively(filepath: string, includeRootDir: boolean = false) {
    if (fs.lstatSync(filepath).isDirectory()) {
        for (let file of fs.readdirSync(filepath)) {
            removeFilePathRecursively(filepath + path.sep + file, true);
        }
        if (includeRootDir) {
            fs.rmdirSync(filepath);
        }
    } else {
        fs.unlinkSync(filepath);
    }
}

export {
    convertArrayObjectsToText,
    waitForQuickPick,
    verifyQuickPicks,
    typeCommandConfirm,
    getCommandPromptOptions,
    openCommandPrompt,
    runCommands,
    notificationExists,
    convertArrayObjectsToTextAndDescription,
    getIndexOfQuickPickItem,
    addFolderToWorkspace,
    removeFolderFromWorkspace,
    removeFilePathRecursively,
    getAllQuickPickItems,
    convertScrollableQuickPicksToTextAndDescription
};