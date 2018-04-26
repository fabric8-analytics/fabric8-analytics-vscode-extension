import * as os from 'os';
import * as path from 'path';
import { extensions, workspace } from 'vscode';

export namespace Utils {
    let EXTENSION_PUBLISHER: string;
    let EXTENSION_NAME: string;
    let EXTENSION_VERSION: string;
    let EXTENSION_AI_KEY: string;

    export function getExtensionPublisher(): string {
        return EXTENSION_PUBLISHER;
    }

    export function getExtensionName(): string {
        return EXTENSION_NAME;
    }

    export function getExtensionId(): string {
        return `${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`;
    }

    export function getExtensionVersion(): string {
        return EXTENSION_VERSION;
    }

    export function getAiKey(): string {
        return EXTENSION_AI_KEY;
    }

    export function getTempFolderPath(...args: string[]): string {
        return path.join(os.tmpdir(), EXTENSION_NAME, ...args);
    }

    export function getPathToExtensionRoot(...args: string[]): string {
        return path.join(extensions.getExtension(getExtensionId()).extensionPath, ...args);
    }

    export function getMavenExecutable(): string {
        const mavenPath: string = workspace.getConfiguration('maven.executable').get<string>('path');
        return mavenPath ? `"${mavenPath}"` : 'mvn';
    }

    export function getNodeExecutable(): string {
        const nodePath: string = workspace.getConfiguration('node.executable').get<string>('path');
        return nodePath ? `"${nodePath}"` : 'npm';
    }
}