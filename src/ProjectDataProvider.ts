import * as vscode from 'vscode';
import { exec } from 'child_process';
import { Utils } from './Utils';

export module  ProjectDataProvider {

    export let effectivef8PomWs: any;
    export let effectivef8Pom: any;

    effectivef8PomWs = (item, skip, cb) => {
        // Directly call the callback if no effective POM generation is required,
        // as is the case where there is no POM.
        if (skip) {
            cb(true);
            return;
        }
        let pomXmlFilePath: string = null;
        pomXmlFilePath = item.fsPath;
        const cmd: string = [
            Utils.getMavenExecutable(),
            'io.github.stackinfo:stackinfo-maven-plugin:0.2:prepare',
            '-f',
            `"${item}"`
        ].join(' ');
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if (error) {
                vscode.window.showErrorMessage(error.message);
                cb(false);
            } else {
                cb(true);
            }
        });
    };

    effectivef8Pom = (item, cb) => {
        let pomXmlFilePath: string = null;
        let filepath: string = 'target/pom.xml';
        pomXmlFilePath = item.fsPath;
        const cmd: string = [
            Utils.getMavenExecutable(),
            'help:effective-pom',
            '-f',
            `"${pomXmlFilePath}"`,
            `-Doutput="${filepath}"`
        ].join(' ');
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if (error) {
                vscode.window.showErrorMessage(error.message);
                cb(false);
            } else {
                let ePomPathList: any = pomXmlFilePath.toLowerCase().split('pom.xml');
                if(ePomPathList.length>0){
                    let ePomPath: string = ePomPathList[0] + filepath;
                    cb(ePomPath);
                }else{
                    vscode.window.showInformationMessage('Looks like there either are some problem with manifest file or mvn is not set in path');
                    cb(false);
                }
            }
        });
    };
    
}
