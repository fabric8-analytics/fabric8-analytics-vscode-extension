'use strict';

import * as vscode from 'vscode';

export namespace Config {

  export function getApiConfig(): any {
    return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
  }

  export function getMvnExecutable(): string {
    const mavenPath: string = vscode.workspace
      .getConfiguration('mvn.executable')
      .get<string>('path');
    return mavenPath ? `"${mavenPath}"` : 'mvn';
  }

  export function getNpmExecutable(): string {
    const npmPath: string = vscode.workspace
      .getConfiguration('npm.executable')
      .get<string>('path');
    return npmPath ? `"${npmPath}"` : 'npm';
  }

  export function getGoExecutable(): string {
    const goPath: string = vscode.workspace
      .getConfiguration('go.executable')
      .get<string>('path');
    return goPath ? `${goPath}` : 'go';
  }
}
