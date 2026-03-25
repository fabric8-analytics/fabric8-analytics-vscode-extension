'use strict';

import * as vscode from 'vscode';

import { StatusMessages, Titles } from './constants';
import { buildBaseOptions, stackAnalysisService } from './exhortServices';
import { updateCurrentWebviewPanel } from './rhda';
import { buildLogErrorMessage } from './utils';
import { DepOutputChannel } from './depOutputChannel';
import { TokenProvider } from './tokenProvider';

/**
 * Executes the RHDA stack analysis process.
 * @param manifestFilePath The file path to the manifest file for analysis.
 * @returns The stack analysis response string.
 */
export async function executeStackAnalysis(tokenProvider: TokenProvider, manifestFilePath: string, outputChannel: DepOutputChannel): Promise<string> {
  return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
    p.report({ message: StatusMessages.WIN_ANALYZING_DEPENDENCIES });

    const options = {
      ...buildBaseOptions(),
      'TRUSTIFY_DA_TOKEN': await tokenProvider.getToken() ?? '',
    };

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
