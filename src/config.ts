'use strict';

import * as vscode from 'vscode';

export namespace Config {

  export function getApiConfig(): any {
    return vscode.workspace.getConfiguration('dependencyAnalytics');
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

  export function getPythonExecutable(): string {
    const pypiPath: string = vscode.workspace
      .getConfiguration('python')
      .get('pythonPath');
    return pypiPath ? `${pypiPath}` : 'python';
  }

  export function getGoExecutable(): string {
    const goPath: string = vscode.workspace
      .getConfiguration('go.executable')
      .get<string>('path');
    return goPath ? `${goPath}` : 'go';
  }
}
