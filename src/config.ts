'use strict';

import * as vscode from 'vscode';

export namespace Config {

  export function getApiConfig(): any {
    return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
  }

  export function getMavenExecutable(): string {
    const mavenPath: string = vscode.workspace
      .getConfiguration('maven.executable')
      .get<string>('path');
    return mavenPath ? `"${mavenPath}"` : 'mvn';
  }

  export function getNodeExecutable(): string {
    const npmPath: string = vscode.workspace
      .getConfiguration('npm.executable')
      .get<string>('path');
    return npmPath ? `"${npmPath}"` : 'npm';
  }
}
