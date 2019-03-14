import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Utils } from './Utils';
import { StatusMessages } from './statusMessages';

export module ProjectDataProvider {
  export const effectivef8Pom = (item, workspaceFolder) => {
    return new Promise((resolve, reject) => {
      let vscodeRootpath = workspaceFolder.uri.fsPath;
      if (
        process &&
        process.platform &&
        process.platform.toLowerCase() === 'win32'
      ) {
        vscodeRootpath += '\\';
      } else {
        vscodeRootpath += '/';
      }
      const filepath = vscodeRootpath + `target/dependencies.txt`;
      const cmd: string = [
        Utils.getMavenExecutable(),
        `clean install -DskipTests=true -f`,
        `"${item}" &&`,
        Utils.getMavenExecutable(),
        'org.apache.maven.plugins:maven-dependency-plugin:3.0.2:tree',
        '-f',
        `"${item}"`,
        `-DoutputFile="${filepath}"`,
        `-DoutputType=dot`,
        `-DappendOutput=true`
      ].join(' ');
      console.log('effectivef8Pom ' + cmd);
      exec(
        cmd,
        (error: Error, _stdout: string, _stderr: string): void => {
          if (error) {
            vscode.window.showErrorMessage(error.message);
            reject(false);
          } else {
            resolve(filepath);
          }
        }
      );
    });
  };

  export const effectivef8Package = (item, workspaceFolder) => {
    return new Promise((resolve, reject) => {
      let vscodeRootpath = workspaceFolder.uri.fsPath;
      if (
        process &&
        process.platform &&
        process.platform.toLowerCase() === 'win32'
      ) {
        vscodeRootpath += '\\';
      } else {
        vscodeRootpath += '/';
      }
      getDependencyVersion(item, vscodeRootpath)
        .then(() => {
          let formPackagedependencyPromise = formPackagedependencyNpmList(
            vscodeRootpath
          );
          formPackagedependencyPromise
            .then(data => {
              resolve(data);
            })
            .catch(() => {
              reject(false);
            });
        })
        .catch(() => {
          reject();
        });
    });
  };

  function isEmptyObject(obj) {
    for (let prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
    return true;
  }

  function clearEmptyObject(myObj) {
    for (let key in myObj) {
      if (
        !(myObj[key] instanceof Array) &&
        typeof myObj[key] === 'object' &&
        isEmptyObject(myObj[key])
      ) {
        delete myObj[key];
      }
    }
    return myObj;
  }

  function formatObj(myObj, keyArrays) {
    for (let key in myObj) {
      if (
        keyArrays.indexOf(key) === -1 &&
        (myObj[key] instanceof Array ||
          typeof myObj[key] !== 'object' ||
          isEmptyObject(myObj[key]))
      ) {
        delete myObj[key];
      } else {
        if (typeof myObj[key] === 'object') {
          formatObj(myObj[key], keyArrays);
        }
      }
    }
    return (myObj = clearEmptyObject(myObj));
  }

  export const formPackagedependencyNpmList = vscodeRootpath => {
    return new Promise((resolve, reject) => {
      fs.readFile(
        vscodeRootpath + 'target/npmlist.json',
        { encoding: 'utf-8' },
        function(err, data) {
          if (data) {
            let packageListDependencies = JSON.parse(data);
            let packageDependencies = formatObj(packageListDependencies, [
              'name',
              'version'
            ]);
            fs.writeFile(
              vscodeRootpath + 'target/npmlist.json',
              JSON.stringify(packageDependencies),
              function(err) {
                if (err) {
                  vscode.window.showErrorMessage(
                    `Unable to format ${vscodeRootpath}target/npmlist.json`
                  );
                  reject(err);
                } else {
                  let ePkgPath: any = vscodeRootpath + 'target/npmlist.json';
                  resolve(ePkgPath);
                }
              }
            );
          } else {
            vscode.window.showErrorMessage(
              `Unable to parse ${vscodeRootpath}target/npmlist.json`
            );
            reject(err);
          }
        }
      );
    });
  };

  export const getDependencyVersion = (item, manifestRootFolderPath) => {
    return new Promise((resolve, reject) => {
      let dir = manifestRootFolderPath + 'target';
      let prefixPath = trimTrailingChars(item);
      let npmPrefixPath = item;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (
        process &&
        process.platform &&
        process.platform.toLowerCase() === 'win32'
      ) {
        npmPrefixPath = trimTrailingChars(npmPrefixPath) + '\\node_modules';
        if (!fs.existsSync(npmPrefixPath)) {
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
      console.log('npm cmd :: ' + cmd);
      exec(
        cmd,
        (error: Error, _stdout: string, _stderr: string): void => {
          if (fs.existsSync(`${manifestRootFolderPath}target/npmlist.json`)) {
            resolve(true);
          } else {
            vscode.window.showErrorMessage(
              `Failed to resolve dependencies for ${manifestRootFolderPath}package.json`
            );
            console.log('_stderr' + _stderr);
            console.log('error' + error);
            reject(false);
          }
        }
      );
    });
  };

  export const trimTrailingChars = s => {
    let result = s.replace(/\\+$/, '');
    return result;
  };

  export const effectivef8Pypi = workspaceFolder => {
    return new Promise((resolve, reject) => {
      let vscodeRootpath = workspaceFolder.uri.fsPath;
      if (
        process &&
        process.platform &&
        process.platform.toLowerCase() === 'win32'
      ) {
        vscodeRootpath += '\\';
      } else {
        vscodeRootpath += '/';
      }

      let reqTxtFilePath: string = vscodeRootpath + 'requirements.txt';
      let filepath: string = vscodeRootpath + 'target/pylist.json';
      let dir = vscodeRootpath + 'target';
      let pyPiInterpreter = Utils.getPypiExecutable();
      if (
        pyPiInterpreter &&
        pyPiInterpreter.indexOf('${workspaceFolder}') !== -1
      ) {
        pyPiInterpreter = pyPiInterpreter.replace(
          '${workspaceFolder}',
          workspaceFolder.uri.fsPath
        );
      }

      if (!pyPiInterpreter) {
        vscode.window
          .showInformationMessage(
            StatusMessages.PYPI_INTERPRETOR_PATH,
            'More Details'
          )
          .then(selection => {
            vscode.commands.executeCommand(
              'vscode.open',
              vscode.Uri.parse(
                'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension#prerequisites'
              )
            );
          });
        reject(false);
        return;
      }
      if (!fs.existsSync(dir)) {
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
      console.log('effectivef8Pypi ' + cmd);
      exec(
        cmd,
        (error: Error, _stdout: string, _stderr: string): void => {
          if (error) {
            vscode.window.showErrorMessage(_stderr);
            console.log(_stderr);
            console.log(error.message);
            reject(_stderr);
          } else {
            let eReqPathList: any = reqTxtFilePath.split('requirements.txt');
            if (eReqPathList.length > 0) {
              let eReqPath: string = eReqPathList[0] + 'target/pylist.json';
              resolve(eReqPath);
            } else {
              reject(StatusMessages.PYPI_FAILURE);
            }
          }
        }
      );
    });
  };
}
