/* eslint-disable @typescript-eslint/naming-convention */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Diagnostic, Uri } from 'vscode';
import * as vscode from 'vscode';
import { notifications } from './extension';

/**
 * Abstract class for implementing a diagnostics pipeline.
 * @typeparam T - The type of elements in the artifact data array.
 */
export abstract class AbstractDiagnosticsPipeline<T> {
  /**
  * An array to hold diagnostic information.
  */
  protected diagnostics: Diagnostic[] = [];
  /**
   * A map to hold vulnerability count information.
   */
  protected vulnCount: Map<string, number> = new Map<string, number>();

  static diagnosticsCollection = vscode.languages.createDiagnosticCollection('rhda');

  /**
   * Creates an instance of AbstractDiagnosticsPipeline.
   * @param diagnosticFilePath - The path to the manifest file to retrieve diagnostics from.
   */
  constructor(protected readonly diagnosticFilePath: Uri) { }

  clearDiagnostics() {
    AbstractDiagnosticsPipeline.diagnosticsCollection.delete(this.diagnosticFilePath);

    notifications.emit('caNotification', {
      done: false,
      uri: this.diagnosticFilePath,
    });
  }

  reportDiagnostics() {
    notifications.emit('caNotification', {
      done: true,
      uri: this.diagnosticFilePath,
      diagCount: this.diagnostics.length,
      vulnCount: this.vulnCount,
    });
  }

  abstract runDiagnostics(artifact: Map<string, T[]>, ecosystem: string): void;
}