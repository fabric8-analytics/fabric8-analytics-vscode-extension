import * as vscode from 'vscode';
import * as fs from 'fs';
import * as paths from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { Utils } from './Utils';
import { StatusMessages } from './statusMessages';
import { outputChannelDep, initOutputChannel } from './extension';
import { DepOutputChannel } from './DepOutputChannel';

export module ProjectDataProvider {
  export const isOutputChannelActivated = (): any => {
    if (!outputChannelDep) {
      return initOutputChannel();
    } else {
      return outputChannelDep;
    }
  };
  export const effectivef8Pom = (item, workspaceFolder) => {
    return new Promise((resolve, reject) => {
      const outputChannelDep = isOutputChannelActivated();
      outputChannelDep.clearOutputChannel();
      let vscodeRootpath = workspaceFolder.uri.fsPath;
      const filepath = paths.join(vscodeRootpath, 'target', 'dependencies.txt');
      const cmd: string = [
        Utils.getMavenExecutable(),
        `--quiet`,
        `clean -f`,
        `"${item}" &&`,
        Utils.getMavenExecutable(),
        `--quiet`,
        'org.apache.maven.plugins:maven-dependency-plugin:3.0.2:tree',
        '-f',
        `"${item}"`,
        `-DoutputFile="${filepath}"`,
        `-DoutputType=dot`,
        `-DappendOutput=true`
      ].join(' ');
      console.log('CMD : ' + cmd);
      outputChannelDep.addMsgOutputChannel('\n CMD :' + cmd);
      exec(
        cmd,
        { maxBuffer: 1024 * 1200 },
        (error: Error, _stdout: string, _stderr: string): void => {
          let outputMsg = `\n STDOUT : ${_stdout} \n STDERR : ${_stderr}`;
          outputChannelDep.addMsgOutputChannel(outputMsg);
          if (error) {
            vscode.window.showErrorMessage(`${error.message}`);
            console.log('_stdout :' + _stdout);
            console.log('_stderr :' + _stderr);
            console.log('error :' + error);
            outputChannelDep.showOutputChannel();
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
      let vscodeRootpath = paths.join(workspaceFolder.uri.fsPath);
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
    let npmListPath = paths.join(vscodeRootpath, 'target', 'npmlist.json');
    return new Promise((resolve, reject) => {
      fs.readFile(npmListPath, { encoding: 'utf-8' }, function(err, data) {
        if (data) {
          let packageListDependencies = JSON.parse(data);
          let packageDependencies = formatObj(packageListDependencies, [
            'name',
            'version'
          ]);
          fs.writeFile(
            npmListPath,
            JSON.stringify(packageDependencies),
            function(err) {
              if (err) {
                vscode.window.showErrorMessage(
                  `Unable to format ${npmListPath}`
                );
                reject(err);
              } else {
                resolve(npmListPath);
              }
            }
          );
        } else {
          vscode.window.showErrorMessage(`Unable to parse ${npmListPath}`);
          reject(err);
        }
      });
    });
  };

  export const getDependencyVersion = (item, manifestRootFolderPath) => {
    const outputChannelDep = isOutputChannelActivated();
    outputChannelDep.clearOutputChannel();
    return new Promise((resolve, reject) => {
      let dir = paths.join(manifestRootFolderPath, 'target');
      let npmPrefixPath = paths.join(manifestRootFolderPath);
      let npmListPath = paths.join(
        manifestRootFolderPath,
        'target',
        'npmlist.json'
      );
      let prefixPath = trimTrailingChars(item);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (os.platform() === 'win32') {
        npmPrefixPath = paths.join(item, 'node_modules');
        if (!fs.existsSync(npmPrefixPath)) {
          fs.mkdirSync(npmPrefixPath);
        }
      }
      const cmd: string = [
        Utils.getNodeExecutable(),
        `--prefix="${npmPrefixPath}"`,
        'install',
        `"${prefixPath}"`,
        `--quiet`,
        '&&',
        Utils.getNodeExecutable(),
        'list',
        `--prefix="${prefixPath}"`,
        '--prod',
        `-json >`,
        `"${npmListPath}"`,
        `--quiet`
      ].join(' ');
      console.log('CMD : ' + cmd);
      outputChannelDep.addMsgOutputChannel('\n CMD :' + cmd);
      exec(
        cmd,
        { maxBuffer: 1024 * 1200 },
        (error: Error, _stdout: string, _stderr: string): void => {
          let outputMsg = `\n STDOUT : ${_stdout} \n STDERR : ${_stderr}`;
          outputChannelDep.addMsgOutputChannel(outputMsg);
          if (fs.existsSync(`${npmListPath}`)) {
            resolve(true);
          } else {
            if (error) {
              vscode.window.showErrorMessage(
                `${error.message}, STDOUT : ${_stdout}, STDERR : ${_stderr}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to resolve dependencies for ${npmListPath}`
              );
            }
            outputChannelDep.showOutputChannel();
            console.log('_stdout :' + _stdout);
            console.log('_stderr :' + _stderr);
            console.log('error :' + error);
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
      let reqTxtFilePath = paths.join(vscodeRootpath, 'requirements.txt');
      let filepath = paths.join(vscodeRootpath, 'target', 'pylist.json');
      let dir = paths.join(vscodeRootpath, 'target');
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
        { maxBuffer: 1024 * 1200 },
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
