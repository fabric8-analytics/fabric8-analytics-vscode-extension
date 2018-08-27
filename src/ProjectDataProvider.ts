import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Utils } from './Utils';

export module  ProjectDataProvider {

    export let effectivef8PomWs: any;
    export let effectivef8Pom: any;
    export let effectivef8Package: any;
    let getDependencyVersion: any;
    let triggerNpmInstall : any;
    let formPackagedependency: any;

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
        console.log('effectivef8PomWs '+ cmd);
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
        console.log('effectivef8Pom '+ cmd);
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
        manifestRootFolderPath = item.toLowerCase().split('package.json')[0];
        getDependencyVersion(manifestRootFolderPath, (depResp) => {
            if(depResp){
                let formPackagedependencyPromise = formPackagedependency(item);
                formPackagedependencyPromise.then((data) => {
                    return cb(data);
                })
                .catch(() => {
                    triggerNpmInstall(manifestRootFolderPath, (npmInstallResp) => {
                        if(npmInstallResp) {
                            console.log('npm install Completed!!');
                            effectivef8Package(item, cb);
                        } else {
                            cb(false);
                        }
                    });
                });  
            }else {
                cb(false);
            }
        });
    };

    formPackagedependency= (item) => {
        let manifestRootFolderPath: string = null;
        manifestRootFolderPath = item.toLowerCase().split('package.json')[0];
        return new Promise((resolve, reject) => {
            let isMissing = false;
            fs.readFile(manifestRootFolderPath+'package.json', {encoding: 'utf-8'}, function(err, data) {
                console.log(data);
                if(data){
                    let packageDependencies = JSON.parse(data);

                    fs.readFile(manifestRootFolderPath+'target/npmlist.json', {encoding: 'utf-8'}, function(err, data) {
                        console.log(data);
                        if(data){
                            let packageListDependencies = JSON.parse(data);
                            let packageDepKeys = Object.keys(packageDependencies.dependencies);
                            for(let i =0; i<packageDepKeys.length;i++) {
                                if(packageListDependencies.dependencies[packageDepKeys[i]] && 
                                    !packageListDependencies.dependencies[packageDepKeys[i]].hasOwnProperty('missing') && 
                                    packageListDependencies.dependencies[packageDepKeys[i]].version) {
                                    packageDependencies.dependencies[packageDepKeys[i]] = packageListDependencies.dependencies[packageDepKeys[i]].version;
                                } else if(packageListDependencies.dependencies[packageDepKeys[i]] && 
                                    packageListDependencies.dependencies[packageDepKeys[i]].hasOwnProperty('missing') &&
                                    packageListDependencies.dependencies[packageDepKeys[i]]['missing']) {
                                    console.log('trigger npm install');
                                    isMissing = true;
                                    break;
                                }
                            }
                            if(isMissing){
                                reject(false);
                            } else{
                                fs.writeFile(manifestRootFolderPath+'target/package.json',JSON.stringify(packageDependencies), function(err) {
                                    if(err) {
                                        vscode.window.showErrorMessage(`Unable to create ${manifestRootFolderPath}target/package.json`);
                                        reject(err);
                                    } else {
                                        let ePkgPath: any = manifestRootFolderPath+'target/package.json';
                                        resolve(ePkgPath);
                                    }  
                                });
                            }
                        } else {
                            vscode.window.showErrorMessage(`Unable to parse ${manifestRootFolderPath}target/npmlist.json`);
                            reject(err);
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(`Unable to parse ${item}`);
                    reject(err);
                }
            });
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
            `"${manifestRootFolderPath}target/npmlist.json"`
        ].join(' ');
        console.log('npm list cmd '+ cmd);
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if(fs.existsSync(`${manifestRootFolderPath}target/npmlist.json`)){
                // Do something
                cb(true);
            } else {
                vscode.window.showErrorMessage(`Failed to resolve dependencies for ${manifestRootFolderPath}package.json`);
                console.log('_stderr'+ _stderr);
                console.log('error'+ error);
                cb(false);
            }
        });
    };

    triggerNpmInstall = (manifestRootFolderPath, cb) => {
        const cmd: string = [
            Utils.getNodeExecutable(),
            'install',
            `--prefix="${manifestRootFolderPath}"`
        ].join(' ');
        console.log('npm install cmd '+ cmd);
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if(_stdout){
                // Do something
                cb(true);
            } else {
                vscode.window.showErrorMessage(`Failed to trigger npm install for ${manifestRootFolderPath}package.json, ERR: ${_stderr}`);
                console.log('_stderr'+ _stderr);
                console.log('error'+ error);
                cb(false);
            }
        });
    };
    
}
