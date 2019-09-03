'use strict';

import * as vscode from 'vscode';
import * as paths from 'path';

import { Apiendpoint } from './apiendpoint';
import { getRequestTimeout, getRequestPollInterval } from './constants';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';
import { DependencyReportPanel } from './dependencyReportPanel';

export module stackanalysismodule {
  export const stackAnalysesLifeCycle = (
    context,
    effectiveF8Var,
    argumentList
  ) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: StatusMessages.EXT_TITLE
      },
      p => {
        return new Promise((resolve, reject) => {
          p.report({ message: StatusMessages.WIN_RESOLVING_DEPENDENCIES });

          ProjectDataProvider[effectiveF8Var](argumentList)
            .then(async dataEpom => {
              await multimanifestmodule.triggerManifestWs(context);
              p.report({
                message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
              });
              return dataEpom;
            })
            .then(async dataEpom => {
              let formData = await multimanifestmodule.form_manifests_payload(
                dataEpom
              );
              return formData;
            })
            .then(async formData => {
              let payloadData = formData;
              const options = {};
              let thatContext: any;
              options['uri'] = `${
                Apiendpoint.STACK_API_URL
              }stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
              options['formData'] = payloadData;
              options['headers'] = {
                showTransitiveReport: 'true',
                origin: 'vscode',
                ecosystem: Apiendpoint.API_ECOSYSTEM
              };
              thatContext = context;
              let respId = await stackAnalysisServices.postStackAnalysisService(
                options,
                thatContext
              );
              p.report({
                message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES
              });
              return respId;
            })
            .then(async respId => {
              console.log(`Analyzing your stack, id ${respId}`);
              const options = {};
              options['uri'] = `${
                Apiendpoint.STACK_API_URL
              }stack-analyses/${respId}?user_key=${
                Apiendpoint.STACK_API_USER_KEY
              }`;
              let timeoutCounter = getRequestTimeout / getRequestPollInterval;
              const interval = setInterval(() => {
                stackAnalysisServices
                  .getStackAnalysisService(options)
                  .then(data => {
                    if (!data.hasOwnProperty('error')) {
                      clearInterval(interval);
                      p.report({
                        message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                      });
                      if (DependencyReportPanel.currentPanel) {
                        DependencyReportPanel.currentPanel.doUpdatePanel(data);
                      }
                      resolve();
                    } else {
                      console.log(`Polling for stack report, remaining count:${timeoutCounter}`);
                      --timeoutCounter;
                      if (timeoutCounter <= 0) {
                        let errMsg = `Failed to trigger application's stack analysis, try in a while.`;
                        clearInterval(interval);
                        p.report({
                          message:
                            StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                        });
                        handleError(errMsg);
                        reject();
                      }
                    }
                  })
                  .catch(error => {
                    clearInterval(interval);
                    p.report({
                      message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                    });
                    handleError(error);
                    reject(error);
                  });
              }, getRequestPollInterval);
            })
            .catch(err => {
              p.report({
                message: StatusMessages.WIN_FAILURE_RESOLVE_DEPENDENCIES
              });
              handleError(err);
              reject();
            });
        });
      }
    );
  };

  export const processStackAnalyses = (
    context,
    workspaceFolder,
    ecosystem,
    uri = null
  ) => {
    let effectiveF8Var: string, argumentList: string;
    Apiendpoint.API_ECOSYSTEM = ecosystem;
    if (ecosystem === 'maven') {
      argumentList = uri
        ? uri.fsPath
        : paths.join(workspaceFolder.uri.fsPath, 'pom.xml');
      effectiveF8Var = 'effectivef8Pom';
    } else if (ecosystem === 'npm') {
      argumentList = uri
        ? uri.fsPath.split('package.json')[0]
        : workspaceFolder.uri.fsPath;
      effectiveF8Var = 'effectivef8Package';
    } else if (ecosystem === 'pypi') {
      argumentList = uri
        ? uri.fsPath.split('requirements.txt')[0]
        : workspaceFolder.uri.fsPath;
      effectiveF8Var = 'effectivef8Pypi';
    }
    stackAnalysesLifeCycle(context, effectiveF8Var, argumentList);
  };

  export const handleError = err => {
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel.doUpdatePanel('error');
    }
    vscode.window.showErrorMessage(err);
  };
}
