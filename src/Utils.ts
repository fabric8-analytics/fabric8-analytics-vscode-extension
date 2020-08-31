'use strict';

import * as vscode from 'vscode';

export namespace Utils {
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

  export function getPypiExecutable(): string {
    const pypiPath: string = vscode.workspace
      .getConfiguration('python')
      .get('pythonPath');
    return pypiPath ? `${pypiPath}` : 'python';
  }

  export function getGoExecutable(): string {
    const goPath: string = vscode.workspace
      .getConfiguration('go')
      .get('goPath');
    return goPath ? `${goPath}` : 'go';
  }
}
