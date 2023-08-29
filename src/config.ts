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
}
