/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode';
import { LicenseFieldPosition } from './collector';
import { LicenseInfo } from '@trustify-da/trustify-da-api-model/model/v5/LicenseInfo';

const RHDA_DIAGNOSTIC_SOURCE = 'RHDA';

/**
 * Pipeline for creating license-related diagnostics.
 */
export class LicenseDiagnosticsPipeline {

  /**
   * Creates a diagnostic for license mismatch between manifest and LICENSE file.
   * @param licenseFieldPosition - Position of the license field in the manifest.
   * @param manifestLicense - License identifier from the manifest.
   * @param fileLicense - License identifier from the LICENSE file.
   * @returns The created diagnostic.
   * @private
   */
  private createLicenseMismatchDiagnostic(
    licenseFieldPosition: LicenseFieldPosition,
    manifestLicense: string,
    fileLicense: string
  ): Diagnostic {
    const range = new Range(
      new Position(
        licenseFieldPosition.position.line - 1,
        licenseFieldPosition.position.column - 1
      ),
      new Position(
        licenseFieldPosition.position.line - 1,
        licenseFieldPosition.position.column - 1 + licenseFieldPosition.value.length
      )
    );

    return {
      severity: DiagnosticSeverity.Error,
      range: range,
      message: `License mismatch: manifest declares "${manifestLicense}" but LICENSE file contains "${fileLicense}"`,
      source: RHDA_DIAGNOSTIC_SOURCE,
      code: 'license-mismatch'
    };
  }

  /**
   * Checks for license mismatch and creates a diagnostic if found.
   * @param licenseSummary - License summary from component analysis response.
   * @param licenseFieldPosition - Position of the license field in the manifest.
   * @returns A diagnostic if mismatch is detected, undefined otherwise.
   */
  checkLicenseMismatch(
    licenseSummary: {
      projectLicense?: {
        manifest?: LicenseInfo;
        file?: LicenseInfo;
        mismatch: boolean;
      };
    },
    licenseFieldPosition: LicenseFieldPosition | undefined
  ): Diagnostic | undefined {
    // No license field position means we can't create a diagnostic
    if (!licenseFieldPosition) {
      return undefined;
    }

    // No mismatch detected
    if (!licenseSummary?.projectLicense?.mismatch) {
      return undefined;
    }

    // Extract license identifiers for the diagnostic message
    const manifestLicenseInfo = licenseSummary.projectLicense.manifest;
    const fileLicenseInfo = licenseSummary.projectLicense.file;

    // Cannot create diagnostic without manifest license info
    if (!manifestLicenseInfo) {
      return undefined;
    }

    // Prefer expression, fall back to name, then identifiers, then 'unknown'
    const manifestLicense = manifestLicenseInfo?.expression ||
      manifestLicenseInfo?.name ||
      (manifestLicenseInfo?.identifiers && manifestLicenseInfo.identifiers.length > 0
        ? manifestLicenseInfo.identifiers[0].id
        : undefined) ||
      'unknown';

    const fileLicense = fileLicenseInfo?.expression ||
      fileLicenseInfo?.name ||
      (fileLicenseInfo?.identifiers && fileLicenseInfo.identifiers.length > 0
        ? fileLicenseInfo.identifiers[0].id
        : undefined) ||
      'unknown';

    return this.createLicenseMismatchDiagnostic(
      licenseFieldPosition,
      manifestLicense,
      fileLicense
    );
  }
}
