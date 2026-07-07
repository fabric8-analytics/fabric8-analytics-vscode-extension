/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { globalConfig } from './config';
import { RHDA_DIAGNOSTIC_SOURCE } from './constants';
import { CodeAction, CodeActionKind, Diagnostic, Position, Range, Uri, WorkspaceEdit } from 'vscode';
import { IPositionedString } from './positionTypes';

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
 * @param packageName - The package name for telemetry tracking.
 * @param version - The recommended version for telemetry tracking.
 * @param versionReplacementString - The version replacement string.
 * @param diagnostic - The diagnostic information.
 * @param uri - The URI of the file.
 * @param replacementRange - Optional range to use for the replacement instead of diagnostic range to be used rather than deriving from the diagnostic
 * @returns A CodeAction object for switching to the recommended version.
 */
function generateSwitchToRecommendedVersionAction(title: string, packageName: string, version: string | undefined, versionReplacementString: string, diagnostic: Diagnostic, uri: Uri, replacementRange?: IPositionedString): CodeAction {
  const codeAction: CodeAction = {
    title: title,
    diagnostics: [diagnostic],
    kind: CodeActionKind.QuickFix,
    edit: new WorkspaceEdit()
  };

  codeAction.edit!.replace(uri, replacementRange ? new Range(
    new Position(replacementRange.position.line - 1, replacementRange.position.column - 1),
    new Position(replacementRange.position.line - 1, replacementRange.position.column - 1 + replacementRange.value.length)
  ) : diagnostic.range, versionReplacementString);

  codeAction.command = {
    title: 'Track recommendation acceptance',
    command: globalConfig.trackRecommendationAcceptanceCommand,
    arguments: [packageName, version, path.basename(uri.fsPath)],
  };

  return codeAction;
}

/**
 * Generates a code action to replace the Dockerfile image with a hardened recommendation.
 * @param title - The title of the code action.
 * @param imageRef - The recommended hardened image reference (for the WorkspaceEdit replacement).
 * @param packageName - The image name without version, for telemetry tracking.
 * @param version - The image version (tag or digest), for telemetry tracking.
 * @param diagnostic - The diagnostic information covering the image name range.
 * @param uri - The URI of the Dockerfile.
 * @param replacementRange - The image name position and value, used to narrow the edit to just the image name portion of the FROM line.
 * @returns A CodeAction object that replaces the image reference and fires the tracking command.
 */
function generateReplaceImageAction(title: string, imageRef: string, packageName: string, version: string | undefined, diagnostic: Diagnostic, uri: Uri, replacementRange: IPositionedString): CodeAction {
  const codeAction: CodeAction = {
    title: title,
    diagnostics: [diagnostic],
    kind: CodeActionKind.QuickFix,
    edit: new WorkspaceEdit()
  };

  codeAction.edit!.replace(uri, new Range(
    new Position(replacementRange.position.line - 1, replacementRange.position.column),
    new Position(replacementRange.position.line - 1, replacementRange.position.column + replacementRange.value.length)
  ), imageRef);

  codeAction.command = {
    title: 'Track recommendation acceptance',
    command: globalConfig.trackRecommendationAcceptanceCommand,
    arguments: [packageName, version, path.basename(uri.fsPath)],
  };

  return codeAction;
}

/**
 * Generates a code action to update the manifest license from the LICENSE file.
 * @param fileLicense - The license identifier from the LICENSE file.
 * @param diagnostic - The diagnostic information.
 * @param uri - The URI of the manifest file.
 * @returns A CodeAction object for updating the manifest license.
 */
function generateUpdateManifestLicenseAction(fileLicense: string, diagnostic: Diagnostic, uri: Uri): CodeAction {
  const codeAction: CodeAction = {
    title: `Update manifest license to "${fileLicense}" (from LICENSE file)`,
    diagnostics: [diagnostic],
    kind: CodeActionKind.QuickFix,
    edit: new WorkspaceEdit()
  };

  // Replace the license value in the manifest
  // The diagnostic range covers only the value text, not the surrounding quotes or XML tags
  codeAction.edit!.replace(uri, diagnostic.range, fileLicense);

  return codeAction;
}

export { getCodeActionsMap, clearCodeActionsMap, registerCodeAction, generateSwitchToRecommendedVersionAction, generateReplaceImageAction, getDiagnosticsCodeActions, generateUpdateManifestLicenseAction };