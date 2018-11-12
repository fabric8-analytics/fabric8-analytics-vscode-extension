'use strict';

import { workspace } from 'vscode';

export class Utils {

    static getMavenExecutable(): string {
        const mavenPath: string = workspace.getConfiguration('maven.executable').get<string>('path');
        return mavenPath ? `"${mavenPath}"` : 'mvn';
    }

    static getNodeExecutable(): string {
        const npmPath: string = workspace.getConfiguration('npm.executable').get<string>('path');
        return npmPath ? `"${npmPath}"` : 'npm';
    }
}