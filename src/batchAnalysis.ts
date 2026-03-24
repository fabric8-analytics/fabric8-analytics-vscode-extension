'use strict';

import * as vscode from 'vscode';

import { StatusMessages, Titles } from './constants';
import { buildBaseOptions, batchStackAnalysisService, BatchOptions } from './exhortServices';
import { globalConfig } from './config';
import { updateCurrentWebviewPanel } from './rhda';
import { buildLogErrorMessage } from './utils';
import { DepOutputChannel } from './depOutputChannel';
import { DependencyReportPanel } from './dependencyReportPanel';
import { TokenProvider } from './tokenProvider';

/**
 * Executes the RHDA batch stack analysis process for a workspace.
 * @param tokenProvider The token provider for authentication.
 * @param workspaceRoot The file path to the workspace root directory.
 * @param outputChannel The output channel for logging.
 * @returns The batch stack analysis response string.
 */
export async function executeBatchStackAnalysis(tokenProvider: TokenProvider, workspaceRoot: string, outputChannel: DepOutputChannel): Promise<string> {
  return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
    p.report({ message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });

    const options: BatchOptions = {
      ...buildBaseOptions(),
      'TRUSTIFY_DA_TOKEN': await tokenProvider.getToken() ?? '',
      'batchConcurrency': globalConfig.batchConcurrency,
      'continueOnError': globalConfig.continueOnError,
      'batchMetadata': globalConfig.batchMetadata,
      'workspaceDiscoveryIgnore': globalConfig.excludePatterns.map(m => m.pattern),
    };

    try {
      outputChannel.info(`generating batch stack analysis report for workspace "${workspaceRoot}"`);

      DependencyReportPanel.createOrShowWebviewPanel();

      const promise = batchStackAnalysisService(workspaceRoot, options);

      p.report({ message: StatusMessages.WIN_GENERATING_DEPENDENCIES });

      const resp = await promise;

      updateCurrentWebviewPanel(resp);

      outputChannel.info(`done generating batch stack analysis report for workspace "${workspaceRoot}"`);

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
