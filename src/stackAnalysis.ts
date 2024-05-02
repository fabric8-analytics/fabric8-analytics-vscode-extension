'use strict';

import * as vscode from 'vscode';

import { StatusMessages, Titles } from './constants';
import { stackAnalysisService } from './exhortServices';
import { globalConfig } from './config';
import { updateCurrentWebviewPanel } from './rhda';


/**
 * Executes the RHDA stack analysis process.
 * @param manifestFilePath The file path to the manifest file for analysis.
 * @returns The stack analysis response string.
 */
export async function executeStackAnalysis(manifestFilePath): Promise<string> {
  try {
    return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
      return new Promise<string>(async (resolve, reject) => {
        p.report({
          message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
        });

        // set up configuration options for the stack analysis request
        const options = {
          'RHDA_TOKEN': globalConfig.telemetryId,
          'RHDA_SOURCE': globalConfig.utmSource,
          'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
          'EXHORT_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
          'EXHORT_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
          'EXHORT_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
          'EXHORT_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
          'EXHORT_MVN_PATH': globalConfig.exhortMvnPath,
          'EXHORT_GRADLE_PATH': globalConfig.exhortGradlePath,
          'EXHORT_NPM_PATH': globalConfig.exhortNpmPath,
          'EXHORT_GO_PATH': globalConfig.exhortGoPath,
          'EXHORT_PYTHON3_PATH': globalConfig.exhortPython3Path,
          'EXHORT_PIP3_PATH': globalConfig.exhortPip3Path,
          'EXHORT_PYTHON_PATH': globalConfig.exhortPythonPath,
          'EXHORT_PIP_PATH': globalConfig.exhortPipPath
        };

        // const snykToken = await globalConfig.getSnykToken();
        // /* istanbul ignore else */
        // if (snykToken !== '') {
        //   options['EXHORT_SNYK_TOKEN'] = snykToken;
        // }

        // execute stack analysis
        await stackAnalysisService(manifestFilePath, options)
          .then(async (resp) => {
            p.report({
              message: StatusMessages.WIN_GENERATING_DEPENDENCIES
            });

            updateCurrentWebviewPanel(resp);

            p.report({
              message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS
            });

            resolve(resp);
          })
          .catch(err => {
            p.report({
              message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS
            });

            reject(err);
          });
      });
    });
  } catch (err) {
    updateCurrentWebviewPanel('error');
    throw (err);
  }
}
