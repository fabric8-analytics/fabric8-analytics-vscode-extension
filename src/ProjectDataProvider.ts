import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Utils } from './Utils';

export module  ProjectDataProvider {

    export let effectivef8PomWs: any;
    export let effectivef8Pom: any;
    export let effectivef8Package: any;
    let getDependencyVersion: any;

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

    effectivef8Package = (item, cb) => {
        let manifestRootFolderPath: string = null;
        // let filepath: string = 'target/pom.xml';
        manifestRootFolderPath = item.fsPath.toLowerCase().split('package.json')[0];
        getDependencyVersion(manifestRootFolderPath, (depResp) => {
            // count++;
            if(depResp){
             // packageDependencies.dependencies[dependenciesKeys[i]] = depResp;
                fs.readFile(item.fsPath, {encoding: 'utf-8'}, function(err, data) {
                    console.log(data);
                    if(data){
                        let packageDependencies = JSON.parse(data);

                        fs.readFile(manifestRootFolderPath+'target/npmlist.json', {encoding: 'utf-8'}, function(err, data) {
                            console.log(data);
                            if(data){
                                let packageListDependencies = JSON.parse(data);
                                let packageDepKeys = Object.keys(packageDependencies.dependencies);
                                for(let i =0; i<packageDepKeys.length;i++) {
                                    if(packageListDependencies.dependencies[packageDepKeys[i]]) {
                                        packageDependencies.dependencies[packageDepKeys[i]] = packageListDependencies.dependencies[packageDepKeys[i]].version;
                                    }
                                }
                                //cb(JSON.stringify(packageListDependencies));
                                fs.writeFile(manifestRootFolderPath+'target/package.json',JSON.stringify(packageDependencies), function(err) {
                                    if(err) {
                                        cb(false);
                                    } else {
                                        let ePkgPath: any = manifestRootFolderPath+'target/package.json';
                                        cb(ePkgPath);
                                    }  

                                });
                            } else {
                                cb(false);
                            }
                        });
                        
                        //cb(JSON.stringify(packageDependencies));
                    } else {
                        cb(false);
                    }
                });
                
            }else {
                cb(false);
            }
        });
    };

    getDependencyVersion = (manifestRootFolderPath, cb) => {
        let dir = manifestRootFolderPath+'target';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        const cmd: string = [
            Utils.getNodeExecutable(),
            'list',
            `--prefix="${manifestRootFolderPath}"`,
            '--depth=0',
            `-json >`,
            `${manifestRootFolderPath}target/npmlist.json`
        ].join(' ');
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if(fs.existsSync(`${manifestRootFolderPath}target/npmlist.json`)){
                // Do something
                cb(true);
            } else {
                cb(false);
            }
            // if (error) {
            //     vscode.window.showErrorMessage(error.message);
            //     cb(false);
            // } else {
            //     // console.log(_stdout);
            //     // let depInfo = JSON.parse(_stdout);
            //     cb(true);
            // }
        });
    };
    
}
