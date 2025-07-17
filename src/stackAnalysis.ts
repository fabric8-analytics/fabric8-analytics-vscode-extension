'use strict';

import * as vscode from 'vscode';

import { StatusMessages, Titles } from './constants';
import { stackAnalysisService } from './exhortServices';
import { globalConfig } from './config';
import { updateCurrentWebviewPanel } from './rhda';
import { buildLogErrorMessage } from './utils';
import { DepOutputChannel } from './depOutputChannel';
import { Options } from '@trustification/exhort-javascript-api';

/**
 * Executes the RHDA stack analysis process.
 * @param manifestFilePath The file path to the manifest file for analysis.
 * @returns The stack analysis response string.
 */
export async function executeStackAnalysis(manifestFilePath: string, outputChannel: DepOutputChannel): Promise<string> {
  return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
    p.report({ message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });

    // set up configuration options for the stack analysis request
    const options: Options = {
      'RHDA_TOKEN': globalConfig.telemetryId,
      'RHDA_SOURCE': globalConfig.utmSource,
      'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
      'EXHORT_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
      'EXHORT_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
      'EXHORT_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
      'EXHORT_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
      'EXHORT_MVN_PATH': globalConfig.exhortMvnPath,
      'EXHORT_PREFER_MVNW': globalConfig.exhortPreferMvnw,
      'EXHORT_MVN_ARGS': globalConfig.exhortMvnArgs,
      'EXHORT_GRADLE_PATH': globalConfig.exhortGradlePath,
      'EXHORT_PREFER_GRADLEW': globalConfig.exhortPreferGradlew,
      'EXHORT_NPM_PATH': globalConfig.exhortNpmPath,
      'EXHORT_PNPM_PATH': globalConfig.exhortPnpmPath,
      'EXHORT_YARN_PATH': globalConfig.exhortYarnPath,
      'EXHORT_GO_PATH': globalConfig.exhortGoPath,
      'EXHORT_PYTHON3_PATH': globalConfig.exhortPython3Path,
      'EXHORT_PIP3_PATH': globalConfig.exhortPip3Path,
      'EXHORT_PYTHON_PATH': globalConfig.exhortPythonPath,
      'EXHORT_PIP_PATH': globalConfig.exhortPipPath,
      'EXHORT_PROXY_URL': globalConfig.exhortProxyUrl
    };

    // execute stack analysis
    try {
      outputChannel.info(`generating stack analysis report for "${manifestFilePath}"`);

      const promise = stackAnalysisService(manifestFilePath, options);

      p.report({ message: StatusMessages.WIN_GENERATING_DEPENDENCIES });

      const resp = await promise;

      updateCurrentWebviewPanel(resp);

      outputChannel.info(`done generating stack analysis report for "${manifestFilePath}"`);

      p.report({ message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS });

      return resp;
    } catch (err) {
      p.report({ message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS });

      updateCurrentWebviewPanel('error');

      outputChannel.error(buildLogErrorMessage(err as Error));

      throw err;
    }
  });
}
