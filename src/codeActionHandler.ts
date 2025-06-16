/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { globalConfig } from './config';
import { RHDA_DIAGNOSTIC_SOURCE } from './constants';
import { CodeAction, CodeActionKind, Diagnostic, Uri, WorkspaceEdit } from 'vscode';

const codeActionsMap: Map<string, Map<string, CodeAction[]>> = new Map<string, Map<string, CodeAction[]>>();

/**
 * Gets the code actions map.
 */
function getCodeActionsMap(): Map<string, Map<string, CodeAction[]>> {
  return codeActionsMap;
}

/**
 * Clears code actions related to a specific file URI from the code actions map.
 * @param uri - The file URI key to remove from the code actions map.
 */
function clearCodeActionsMap(uri: Uri) {
  codeActionsMap.delete(uri.toString());
}

/**
 * Registers a code action.
 * @param uri - The file uri to register the file code action map (inner map) against.
 * @param loc - The location in file to register the file code action against.
 * @param codeAction - The code action to be registered.
 */
function registerCodeAction(uri: Uri, loc: string, codeAction: CodeAction) {
  const innerMap = codeActionsMap.get(uri.toString()) || new Map<string, CodeAction[]>();
  const actionsAtLocation = innerMap.get(loc) || [];
  actionsAtLocation.push(codeAction);
  innerMap.set(loc, actionsAtLocation);
  codeActionsMap.set(uri.toString(), innerMap);
}

/**
 * Retrieves code actions based on diagnostics and file type.
 * @param diagnostics - An array of available diagnostics.
 * @param uri - The URI of the file being analyzed.
 * @returns An array of CodeAction objects to be made available to the user.
 */
function getDiagnosticsCodeActions(diagnostics: readonly Diagnostic[], uri: Uri): CodeAction[] {
  let hasRhdaDiagonostic: boolean = false;
  const codeActions: CodeAction[] = [];

  for (const diagnostic of diagnostics) {

    const fileCodeActionsMap = codeActionsMap.get(uri.toString()) || new Map<string, CodeAction[]>();
    const loc = `${diagnostic.range.start.line}|${diagnostic.range.start.character}`;
    const diagnosticCodeActions = fileCodeActionsMap.get(loc) || [];
    codeActions.push(...diagnosticCodeActions);

    hasRhdaDiagonostic ||= diagnostic.source === RHDA_DIAGNOSTIC_SOURCE;
  }

  if (globalConfig.stackAnalysisCommand && hasRhdaDiagonostic) {
    codeActions.push(generateFullStackAnalysisAction());
  }

  return codeActions;
}

/**
 * Generates a code action for a detailed RHDA report on the analyzed manifest file.
 * @returns A CodeAction object for an RHDA report.
 */
function generateFullStackAnalysisAction(): CodeAction {
  return {
    title: 'Detailed Vulnerability Report',
    kind: CodeActionKind.QuickFix,
    command: {
      title: 'Analytics Report',
      command: globalConfig.stackAnalysisCommand,
      arguments: ['', true],
    }
  };
}

/**
 * Generates a code action to switch to the recommended version.
 * @param title - The title of the code action.
 * @param dependency - The dependency (package and version) provided by exhort.
 * @param versionReplacementString - The version replacement string.
 * @param diagnostic - The diagnostic information.
 * @param uri - The URI of the file.
 * @returns A CodeAction object for switching to the recommended version.
 */
function generateSwitchToRecommendedVersionAction(title: string, dependency: string, versionReplacementString: string, diagnostic: Diagnostic, uri: Uri): CodeAction {
  const codeAction: CodeAction = {
    title: title,
    diagnostics: [diagnostic],
    kind: CodeActionKind.QuickFix,
    edit: new WorkspaceEdit()
  };

  codeAction.edit!.insert(uri, diagnostic.range.start, versionReplacementString);

  codeAction.command = {
    title: 'Track recommendation acceptance',
    command: globalConfig.trackRecommendationAcceptanceCommand,
    arguments: [dependency, path.basename(uri.fsPath)],
  };

  return codeAction;
}

/**
 * Generates a code action to redirect to the recommended version catalog.
 * @param title - The title of the code action.
 * @param imageRef - The image reference provided by exhort.
 * @param diagnostic - The diagnostic information.
 * @param uri - The URI of the file.
 * @returns A CodeAction object for redirecting to the recommended version catalog.
 */
function generateRedirectToRecommendedVersionAction(title: string, imageRef: string, diagnostic: Diagnostic, uri: Uri): CodeAction {
  const codeAction: CodeAction = {
    title: title,
    diagnostics: [diagnostic],
    kind: CodeActionKind.QuickFix,
  };

  codeAction.command = {
    title: 'Track recommendation acceptance',
    command: globalConfig.trackRecommendationAcceptanceCommand,
    arguments: [imageRef, path.basename(uri.fsPath)],
  };

  return codeAction;
}

export { getCodeActionsMap, clearCodeActionsMap, registerCodeAction, generateSwitchToRecommendedVersionAction, generateRedirectToRecommendedVersionAction, getDiagnosticsCodeActions };