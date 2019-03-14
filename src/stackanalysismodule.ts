'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';
import { multimanifestmodule } from './multimanifestmodule';
import { ProjectDataProvider } from './ProjectDataProvider';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';
import { DependencyReportPanel } from './dependencyReportPanel';

export module stackanalysismodule {
  export const stackAnalysesLifeCycle = (
    context,
    effectiveF8Var,
    argumentList,
    workspaceFolder
  ) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: StatusMessages.EXT_TITLE
      },
      p => {
        return new Promise((resolve, reject) => {
          p.report({ message: StatusMessages.WIN_RESOLVING_DEPENDENCIES });

          ProjectDataProvider[effectiveF8Var](argumentList, workspaceFolder)
            .then(async dataEpom => {
              await multimanifestmodule.triggerManifestWs(context);
              p.report({
                message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
              });
              return dataEpom;
            })
            .then(async dataEpom => {
              let formData = await multimanifestmodule.form_manifests_payload(
                dataEpom,
                workspaceFolder
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
                    }
                    // keep on waiting
                  })
                  .catch(error => {
                    clearInterval(interval);
                    p.report({
                      message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES
                    });
                    handleError(error);
                    reject(error);
                  });
              }, 6000);
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
    editor = null
  ) => {
    let effectiveF8Var: string, argumentList: string;
    Apiendpoint.API_ECOSYSTEM = ecosystem;
    if (ecosystem === 'maven') {
      argumentList = editor
        ? editor.document.uri.fsPath
        : workspaceFolder.uri.fsPath;
      effectiveF8Var = 'effectivef8Pom';
    } else if (ecosystem === 'npm') {
      argumentList = editor
        ? editor.document.uri.fsPath.split('package.json')[0]
        : workspaceFolder.uri.fsPath;
      effectiveF8Var = 'effectivef8Package';
    }
    stackAnalysesLifeCycle(
      context,
      effectiveF8Var,
      argumentList,
      workspaceFolder
    );
  };

  export const handleError = err => {
    if (DependencyReportPanel.currentPanel) {
      DependencyReportPanel.currentPanel.doUpdatePanel('error');
    }
    vscode.window.showErrorMessage(err);
  };
}
