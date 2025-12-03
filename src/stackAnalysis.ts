'use strict';

import * as vscode from 'vscode';

import { StatusMessages, Titles } from './constants';
import { stackAnalysisService } from './exhortServices';
import { globalConfig } from './config';
import { updateCurrentWebviewPanel } from './rhda';
import { buildLogErrorMessage } from './utils';
import { DepOutputChannel } from './depOutputChannel';
import { Options } from '@trustify-da/trustify-da-javascript-client';

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
      'TRUSTIFY_DA_BACKEND_URL': globalConfig.backendUrl,
      'TRUSTIFY_DA_TOKEN': globalConfig.telemetryId,
      'TRUSTIFY_DA_SOURCE': globalConfig.utmSource,
      'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
      'TRUSTIFY_DA_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
      'TRUSTIFY_DA_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
      'TRUSTIFY_DA_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
      'TRUSTIFY_DA_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
      'TRUSTIFY_DA_MVN_PATH': globalConfig.exhortMvnPath,
      'TRUSTIFY_DA_PREFER_MVNW': globalConfig.exhortPreferMvnw,
      'TRUSTIFY_DA_MVN_ARGS': globalConfig.exhortMvnArgs,
      'TRUSTIFY_DA_GRADLE_PATH': globalConfig.exhortGradlePath,
      'TRUSTIFY_DA_PREFER_GRADLEW': globalConfig.exhortPreferGradlew,
      'TRUSTIFY_DA_NPM_PATH': globalConfig.exhortNpmPath,
      'TRUSTIFY_DA_PNPM_PATH': globalConfig.exhortPnpmPath,
      'TRUSTIFY_DA_YARN_PATH': globalConfig.exhortYarnPath,
      'TRUSTIFY_DA_GO_PATH': globalConfig.exhortGoPath,
      'TRUSTIFY_DA_PYTHON3_PATH': globalConfig.exhortPython3Path,
      'TRUSTIFY_DA_PIP3_PATH': globalConfig.exhortPip3Path,
      'TRUSTIFY_DA_PYTHON_PATH': globalConfig.exhortPythonPath,
      'TRUSTIFY_DA_PIP_PATH': globalConfig.exhortPipPath,
      'TRUSTIFY_DA_PROXY_URL': globalConfig.exhortProxyUrl
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
