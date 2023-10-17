'use strict';

import * as vscode from 'vscode';

export function getApiConfig(): any {
  return vscode.workspace.getConfiguration('redHatDependencyAnalytics');
}

export function getMvnExecutable(): string {
  const mvnPath: string = vscode.workspace
    .getConfiguration('mvn.executable')
    .get<string>('path');
  return mvnPath ? `"${mvnPath}"` : 'mvn';
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

export function getPython3Executable(): string {
  const python3Path: string = vscode.workspace
    .getConfiguration('python3.executable')
    .get<string>('path');
  return python3Path ? `${python3Path}` : 'python3';
}

export function getPip3Executable(): string {
  const pip3Path: string = vscode.workspace
    .getConfiguration('pip3.executable')
    .get<string>('path');
  return pip3Path ? `${pip3Path}` : 'pip3';
}

export function getPythonExecutable(): string {
  const pythonPath: string = vscode.workspace
    .getConfiguration('python.executable')
    .get<string>('path');
  return pythonPath ? `${pythonPath}` : 'python';
}

export function getPipExecutable(): string {
  const pipPath: string = vscode.workspace
    .getConfiguration('pip.executable')
    .get<string>('path');
  return pipPath ? `${pipPath}` : 'pip';
}
