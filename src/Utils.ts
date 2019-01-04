'use strict';

import { workspace } from 'vscode';

export namespace Utils {
  export function getMavenExecutable(): string {
    const mavenPath: string = workspace
      .getConfiguration('maven.executable')
      .get<string>('path');
    return mavenPath ? `"${mavenPath}"` : 'mvn';
  }

  export function getNodeExecutable(): string {
    const npmPath: string = workspace
      .getConfiguration('npm.executable')
      .get<string>('path');
    return npmPath ? `"${npmPath}"` : 'npm';
  }

  export function getPypiExecutable(): string {
    const pypiPath: string = workspace
      .getConfiguration('python')
      .get('pythonPath');
    return pypiPath;
  }
}
