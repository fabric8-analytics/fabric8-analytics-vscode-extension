import * as vscode from 'vscode';
import * as fs from 'fs';
import * as paths from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { Config } from './config';
import { getSelectedInterpreterPath } from './msPythonExtension';
import { StatusMessages } from './statusMessages';
import { outputChannelDep, initOutputChannel } from './extension';
import { Commands } from './commands';
import { dirname } from 'path';

export module ProjectDataProvider {
  export const isOutputChannelActivated = (): any => {
    if (!outputChannelDep) {
      return initOutputChannel();
    } else {
      return outputChannelDep;
    }
  };
  export const effectivef8Pom = item => {
    return new Promise((resolve, reject) => {
      const outputChannelDep = isOutputChannelActivated();
      outputChannelDep.clearOutputChannel();
      let tempTarget = item.replace('pom.xml', '');
      const filepath = paths.join(tempTarget, 'target', 'dependencies.txt');
      const cmd: string = [
        Config.getMavenExecutable(),
        `--quiet`,
        `clean -f`,
        `"${item}" &&`,
        Config.getMavenExecutable(),
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
            vscode.window
              .showErrorMessage(`${error.message}.`, 'Show Output Log ...')
              .then((selection: any) => {
                if (selection === 'Show Output Log ...') {
                  vscode.commands.executeCommand(Commands.TRIGGER_STACK_LOGS);
                }
              });
            console.log('_stdout :' + _stdout);
            console.log('_stderr :' + _stderr);
            console.log('error :' + error);
            reject(false);
          } else {
            resolve(filepath);
          }
        }
      );
    });
  };

  export const effectivef8Package = item => {
    return new Promise((resolve, reject) => {
      getDependencyVersion(item)
        .then(() => {
          let formPackagedependencyPromise = formPackagedependencyNpmList(item);
          formPackagedependencyPromise
            .then(data => {
              resolve(data);
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
          reject(err);
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

  export const formPackagedependencyNpmList = item => {
    let npmListPath = paths.join(item, 'target', 'npmlist.json');
    return new Promise((resolve, reject) => {
      fs.readFile(npmListPath, { encoding: 'utf-8' }, function (err, data) {
        if (data) {
          let packageListDependencies = JSON.parse(data);
          let packageDependencies = formatObj(packageListDependencies, [
            'name',
            'version'
          ]);
          fs.writeFile(
            npmListPath,
            JSON.stringify(packageDependencies),
            function (err) {
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
          reject(`Unable to parse ${npmListPath}`);
        }
      });
    });
  };

  export const getDependencyVersion = item => {
    const outputChannelDep = isOutputChannelActivated();
    outputChannelDep.clearOutputChannel();
    return new Promise((resolve, reject) => {
      let dir = paths.join(item, 'target');
      let npmPrefixPath = paths.join(item);
      let npmListPath = paths.join(item, 'target', 'npmlist.json');

      let prefixPath = trimTrailingChars(item);
      let cmdList: string[];
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      } else if (fs.existsSync(`${npmListPath}`)) {
        fs.unlink(npmListPath, err => {
          if (err) {
            console.log(`unable to delete npmlist. ${err}`);
          }
        });
      }
      if (os.platform() === 'win32') {
        cmdList = [
          Config.getNodeExecutable(),
          'install',
          `"${prefixPath}"`,
          `--quiet`,
          '&&',
          Config.getNodeExecutable(),
          'list',
          `--prefix="${prefixPath}"`,
          '--prod',
          `-json >`,
          `"${npmListPath}"`,
          `--quiet`
        ];
      } else {
        cmdList = [
          Config.getNodeExecutable(),
          `--prefix="${npmPrefixPath}"`,
          'install',
          `"${prefixPath}"`,
          `--quiet`,
          '&&',
          Config.getNodeExecutable(),
          'list',
          `--prefix="${prefixPath}"`,
          '--prod',
          `-json >`,
          `"${npmListPath}"`,
          `--quiet`
        ];
      }
      const CMD: string = cmdList.join(' ');
      console.log('CMD : ' + CMD);
      outputChannelDep.addMsgOutputChannel('\n CMD :' + CMD);
      exec(
        CMD,
        { maxBuffer: 1024 * 1200 },
        (error: Error, _stdout: string, _stderr: string): void => {
          let outputMsg = `\n STDOUT : ${_stdout} \n STDERR : ${_stderr}`;
          outputChannelDep.addMsgOutputChannel(outputMsg);
          if (fs.existsSync(`${npmListPath}`)) {
            resolve(true);
          } else {
            if (error) {
              vscode.window
                .showErrorMessage(`${error.message}.`, 'Show Output Log ...')
                .then((selection: any) => {
                  if (selection === 'Show Output Log ...') {
                    vscode.commands.executeCommand(Commands.TRIGGER_STACK_LOGS);
                  }
                });
            }
            console.log('_stdout :' + _stdout);
            console.log('_stderr :' + _stderr);
            console.log('error :' + error);
            let errMsg = error
              ? error.message
              : 'Unable to resolve dependencies';
            reject(errMsg);
          }
        }
      );
    });
  };

  export const trimTrailingChars = s => {
    let result = s.replace(/\\+$/, '');
    return result;
  };

  export const effectivef8Pypi = item => {
    return new Promise(async (resolve, reject) => {
      const outputChannelDep = isOutputChannelActivated();
      outputChannelDep.clearOutputChannel();
      let vscodeRootpath = item.replace('requirements.txt', '');
      const filepath = paths.join(vscodeRootpath, 'target', 'pylist.json');
      let reqTxtFilePath = paths.join(vscodeRootpath, 'requirements.txt');
      let dir = paths.join(vscodeRootpath, 'target');
      const uri = vscode.Uri.parse(reqTxtFilePath);
      const pyPiInterpreter = await getSelectedInterpreterPath(outputChannelDep.getOutputChannel(), uri) || Config.getPythonExecutable();

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
        `-m pip install`,
        `-r`,
        `"${reqTxtFilePath}"`,
        `&&`,
        pyPiInterpreter,
        '-', // similar to `echo "print('hello')" | python - arg1 arg2`
        `"${reqTxtFilePath}"`,
        `"${filepath}"`
      ].join(' ');
      console.log('CMD : ' + cmd);
      outputChannelDep.addMsgOutputChannel('\n CMD :' + cmd);
      const depGenerator = exec(
        cmd,
        { maxBuffer: 1024 * 1200 },
        (error: Error, _stdout: string, _stderr: string): void => {
          let outputMsg = `\n STDOUT : ${_stdout} \n STDERR : ${_stderr}`;
          outputChannelDep.addMsgOutputChannel(outputMsg);
          if (error) {
            vscode.window.showErrorMessage(_stderr);
            console.log(_stderr);
            console.log(error.message);
            reject(_stderr);
          } else {
            resolve(filepath);
          }
        }
      );
      console.log('SCRIPT -: ' + StatusMessages.PYPI_INTERPRETOR_CMD);
      // write the dependency generator script into stdin
      depGenerator.stdin.end(StatusMessages.PYPI_INTERPRETOR_CMD);
    });
  };

  export const effectivef8Golang = manifestPath => {
    return new Promise((resolve, reject) => {
      const outputChannelDep = isOutputChannelActivated();
      outputChannelDep.clearOutputChannel();
      let vscodeRootpath = dirname(manifestPath);
      let targetDir = paths.join(vscodeRootpath, 'target');
      const goGraphFilePath = paths.join(targetDir, 'golist.json');

      const goBin = paths.join(os.tmpdir(), 'gomanifest', 'bin');
      const goManifestPath = paths.join(goBin, 'gomanifest');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      const cmd: string = [
        Config.getGoExecutable(),
        `install`,
        `github.com/fabric8-analytics/cli-tools/gomanifest@latest`,
        `&&`,
        `${goManifestPath}`,
        `"${vscodeRootpath}"`,
        `"${goGraphFilePath}"`,
        `"${Config.getGoExecutable()}"`,
      ].join(' ');

      console.log('CMD : ' + cmd);
      outputChannelDep.addMsgOutputChannel('\n CMD :' + cmd);
      exec(
        cmd,
        { maxBuffer: 1024 * 1200, env: Object.assign({}, process.env, { "GOBIN": goBin }) },
        (error: Error, _stdout: string, _stderr: string): void => {
          let outputMsg = `\n STDOUT : ${_stdout} \n STDERR : ${_stderr} \n error : ${error}`;
          outputChannelDep.addMsgOutputChannel(outputMsg);
          if (error) {
            vscode.window
              .showErrorMessage(`${error.message}.`, 'Show Output Log ...')
              .then((selection: any) => {
                if (selection === 'Show Output Log ...') {
                  vscode.commands.executeCommand(Commands.TRIGGER_STACK_LOGS);
                }
              });
            console.log('_stdout :' + _stdout);
            console.log('_stderr :' + _stderr);
            console.log('error :' + error);
            reject(false);
          } else {
            resolve(goGraphFilePath);
          }
        }
      );
    });
  };
}
