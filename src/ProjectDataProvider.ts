import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Utils } from './Utils';

export class  ProjectDataProvider {

    static effectivef8PomWs(item, cb) {
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

    static effectivef8Pom(item, cb) {
        let pomXmlFilePath: string = null;
        let filepath: string = 'target/pom.xml';
        pomXmlFilePath = item;
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
                let ePomPathList: any = pomXmlFilePath.split('pom.xml');
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

    static effectivef8Package(item, cb) {
        let manifestRootFolderPath: string = null;
        manifestRootFolderPath = item.split('package.json')[0];
        this.getDependencyVersion(manifestRootFolderPath, (depResp) => {
            if(depResp){
                let formPackagedependencyPromise = this.formPackagedependency(item);
                formPackagedependencyPromise.then((data) => {
                    return cb(data);
                })
                .catch(() => {
                    cb(false);
                });  
            }else {
                cb(false);
            }
        });
    };

    static formPackagedependency(item) {
        let manifestRootFolderPath: string = null;
        manifestRootFolderPath = item.split('package.json')[0];
        return new Promise((resolve, reject) => {
            fs.readFile(manifestRootFolderPath+'package.json', {encoding: 'utf-8'}, function(err, data) {
                if(data){
                    let packageDependencies = JSON.parse(data);
                    fs.readFile(manifestRootFolderPath+'target/npmlist.json', {encoding: 'utf-8'}, function(err, data) {
                        if(data){
                            let packageListDependencies = JSON.parse(data);
                            let packageDepKeys = [];
                            if(packageDependencies && packageDependencies.hasOwnProperty('dependencies')) {
                                packageDepKeys = Object.keys(packageDependencies.dependencies);
                            }
                            for(let i =0; i<packageDepKeys.length;i++) {
                                if(packageListDependencies.dependencies[packageDepKeys[i]] && 
                                    packageListDependencies.dependencies[packageDepKeys[i]].version) {
                                    packageDependencies.dependencies[packageDepKeys[i]] = packageListDependencies.dependencies[packageDepKeys[i]].version;
                                } 
                            }
                            fs.writeFile(manifestRootFolderPath+'target/package.json',JSON.stringify(packageDependencies), function(err) {
                                if(err) {
                                    vscode.window.showErrorMessage(`Unable to create ${manifestRootFolderPath}target/package.json`);
                                    reject(err);
                                } else {
                                    let ePkgPath: any = manifestRootFolderPath+'target/package.json';
                                    resolve(ePkgPath);
                                }  
                            });
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

    static getDependencyVersion(manifestRootFolderPath, cb) {
        let dir = manifestRootFolderPath+'target';
        let prefixPath = this.trimTrailingChars(manifestRootFolderPath);
        let npmPrefixPath = manifestRootFolderPath;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
            npmPrefixPath += 'node_modules';
            if (!fs.existsSync(npmPrefixPath)){
                fs.mkdirSync(npmPrefixPath);
            }
        }

        const cmd: string = [
            Utils.getNodeExecutable(),
            `--prefix="${npmPrefixPath}"`,
            'install',
            `"${prefixPath}"`,
            '&&',
            Utils.getNodeExecutable(),
            'list',
            `--prefix="${prefixPath}"`,
            '--prod',
            `-json >`,
            `"${manifestRootFolderPath}target/npmlist.json"`
        ].join(' ');
        console.log('npm cmd :: '+ cmd);
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


    static trimTrailingChars(s) {
        let result = s.replace(/\\+$/, '');
        return result;
    };
}
