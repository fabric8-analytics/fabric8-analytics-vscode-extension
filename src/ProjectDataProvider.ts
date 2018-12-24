import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Utils } from './Utils';
import { StatusMessages } from './statusMessages';

export module  ProjectDataProvider {

    export let effectivef8PomWs: any;
    export let effectivef8Pom: any;
    export let effectivef8Package: any;
    export let getDependencyVersion: any;
    export let formPackagedependencyNpmList: any;
    export let effectivef8Pypi: any;

    let trimTrailingChars: any;

    effectivef8PomWs = (workspaceFolder) => {
        return new Promise(function(resolve, reject){
            let vscodeRootpath = workspaceFolder.uri.fsPath;
            if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                vscodeRootpath += '\\';
            } else {
                vscodeRootpath += '/'; 
            }
            const cmd: string = [
                Utils.getMavenExecutable(),
                'io.github.stackinfo:stackinfo-maven-plugin:0.2:prepare',
                '-f',
                `"${vscodeRootpath}"`
            ].join(' ');
            console.log('effectivef8PomWs '+ cmd);
            exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
                if (error) {
                    vscode.window.showErrorMessage(error.message);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        });
    };

    effectivef8Pom = (item) => {
        return new Promise(function(resolve, reject){
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
                    reject(false);
                } else {
                    let ePomPathList: any = pomXmlFilePath.split('pom.xml');
                    if(ePomPathList.length>0){
                        let ePomPath: string = ePomPathList[0] + filepath;
                        resolve(ePomPath);
                    }else{
                        vscode.window.showInformationMessage('Looks like there either are some problem with manifest file or mvn is not set in path');
                        reject(false);
                        
                    }
                }
            });
        });
    }; 

    effectivef8Package = (workspaceFolder) => {
        return new Promise(function(resolve, reject){
            let vscodeRootpath = workspaceFolder.uri.fsPath;
            if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                vscodeRootpath += '\\';
            } else {
                vscodeRootpath += '/'; 
            }
            getDependencyVersion(vscodeRootpath).then(()=> {
                let formPackagedependencyPromise = formPackagedependencyNpmList(vscodeRootpath);
                formPackagedependencyPromise.then((data) => {
                    resolve(data);
                })
                .catch(() => {
                    reject(false);
                }); 
            }).catch(() => {
                reject();
            });
        });
    };

    function isEmptyObject(obj) {
        for(let prop in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            return false;
          }
        }
        return true;
    }

    function clearEmptyObject(myObj) {
        for(let key in myObj){
            if(!(myObj[key] instanceof Array) && typeof(myObj[key]) == 'object' && isEmptyObject(myObj[key])){
                delete myObj[key];
            } 
        }
        return myObj;
    }

    function formatObj(myObj, keyArrays){
        for(let key in myObj){
            if(keyArrays.indexOf(key) === -1 && ( myObj[key] instanceof Array || typeof(myObj[key]) != 'object' || isEmptyObject(myObj[key]))){
                delete myObj[key];
            } else {
                if(typeof(myObj[key]) == 'object') {
                    formatObj(myObj[key],keyArrays);
                }
            }  
        }
        return myObj = clearEmptyObject(myObj);
    }

    formPackagedependencyNpmList = (vscodeRootpath) => {
        return new Promise((resolve, reject) => {
            fs.readFile(vscodeRootpath+'target/npmlist.json', {encoding: 'utf-8'}, function(err, data) {
                if(data){
                    let packageListDependencies = JSON.parse(data);
                    let packageDependencies = formatObj(packageListDependencies, ['name','version']);
                    fs.writeFile(vscodeRootpath+'target/npmlist.json',JSON.stringify(packageDependencies), function(err) {
                        if(err) {
                            vscode.window.showErrorMessage(`Unable to format ${vscodeRootpath}target/npmlist.json`);
                            reject(err);
                        } else {
                            let ePkgPath: any = vscodeRootpath+'target/npmlist.json';
                            resolve(ePkgPath);
                        }  
                    });
                } else {
                    vscode.window.showErrorMessage(`Unable to parse ${vscodeRootpath}target/npmlist.json`);
                    reject(err);
                }
            });
        });
    };


    getDependencyVersion = (manifestRootFolderPath) => {
        return new Promise(function(resolve, reject){
            let dir = manifestRootFolderPath+'target';
            let prefixPath = trimTrailingChars(manifestRootFolderPath);
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
                    resolve(true);
                } else {
                    vscode.window.showErrorMessage(`Failed to resolve dependencies for ${manifestRootFolderPath}package.json`);
                    console.log('_stderr'+ _stderr);
                    console.log('error'+ error);
                    reject(false);
                }
            });
        });
    };


    trimTrailingChars = (s)  => {
        let result = s.replace(/\\+$/, '');
        return result;
    };

    effectivef8Pypi = (workspaceFolder) => {
        return new Promise(function(resolve, reject){
            let vscodeRootpath = workspaceFolder.uri.fsPath;
            if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                vscodeRootpath += '\\';
            } else {
                vscodeRootpath += '/'; 
            }

            let reqTxtFilePath: string = vscodeRootpath + 'requirements.txt';
            let filepath: string = vscodeRootpath+ 'target/pylist.json';
            let dir = vscodeRootpath+'target';
            let pyPiInterpreter = Utils.getPypiExecutable();
            if(pyPiInterpreter && pyPiInterpreter.indexOf('${workspaceFolder}')!== -1){
                pyPiInterpreter = pyPiInterpreter.replace('${workspaceFolder}',workspaceFolder.uri.fsPath);
            }
        
            if(!pyPiInterpreter){
                vscode.window.showInformationMessage(StatusMessages.PYPI_INTERPRETOR_PATH, 'More Details')
                .then(selection => {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension#prerequisites'));
                });
                reject(false);
                return;
            }
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            const cmd: string = [
                pyPiInterpreter,
                `-m pip install -r `,
                ` ${reqTxtFilePath};`,
                pyPiInterpreter,
                StatusMessages.PYPI_INTERPRETOR_CMD,
                ` ${reqTxtFilePath}`,
                ` ${filepath}`
            ].join(' ');
            console.log('effectivef8Pypi '+ cmd);
            exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
                if (error) {
                    vscode.window.showErrorMessage(_stderr);
                    console.log(_stderr);
                    console.log(error.message);
                    reject(false);
                } else {
                    let eReqPathList: any = reqTxtFilePath.split('requirements.txt');
                    if(eReqPathList.length>0){
                        let eReqPath: string = eReqPathList[0] + 'target/pylist.json';
                        resolve(eReqPath);
                    }else{
                        vscode.window.showInformationMessage('Looks like there either are some problem with manifest file or python interpreter is not set');
                        reject(false);
                    }
                }
            });
        });
    };

}
