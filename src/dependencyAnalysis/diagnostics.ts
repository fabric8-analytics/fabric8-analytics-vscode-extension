/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Dependency, DependencyMap, IDependencyProvider, getRange } from '../dependencyAnalysis/collector';
import { IPositionedContext } from '../positionTypes';
import { executeComponentAnalysis, DependencyData } from './analysis';
import { Vulnerability } from '../vulnerability';
import { VERSION_PLACEHOLDER } from '../constants';
import { clearCodeActionsMap, registerCodeAction, generateSwitchToRecommendedVersionAction, generateUpdateManifestLicenseAction } from '../codeActionHandler';
import { buildLogErrorMessage, buildNotificationErrorMessage } from '../utils';
import { AbstractDiagnosticsPipeline } from '../diagnosticsPipeline';
import { Diagnostic, DiagnosticSeverity, Uri } from 'vscode';
import { notifications, outputChannelDep } from '../extension';
import { globalConfig } from '../config';
import { Options } from '@trustify-da/trustify-da-javascript-client';
import { TokenProvider } from '../tokenProvider';
import { LicenseDiagnosticsPipeline } from './licenseDiagnostics';

/**
 * Implementation of DiagnosticsPipeline interface.
 * @typeparam DependencyData - The type of elements in the dependency data array.
 */
class DiagnosticsPipeline extends AbstractDiagnosticsPipeline<DependencyData> {

  /**
   * Creates an instance of DiagnosticsPipeline.
   * @param dependencyMap - The dependency map containing information about dependencies derived from the dependency manifest.
   * @param diagnosticFilePath - The path to the manifest file to retrieve diagnostics from.
   */
  constructor(private dependencyMap: DependencyMap, diagnosticFilePath: Uri) {
    super(diagnosticFilePath);
  }

  /**
   * Adds a license diagnostic to the diagnostics array.
   * @param diagnostic - The diagnostic to add.
   */
  addLicenseDiagnostic(diagnostic: Diagnostic) {
    this.diagnostics.push(diagnostic);
  }

  /**
   * Runs diagnostics on dependencies.
   * @param dependencies - A map containing dependency data by reference string.
   * @param ecosystem - The name of the ecosystem in which dependencies are being analyzed.
   */
  runDiagnostics(dependencies: Map<string, DependencyData[]>, ecosystem: string) {
    dependencies.forEach((dependencyData, ref) => {
      const dependencyRef = ref.split('@')[0];
      const dependency = this.dependencyMap.get(dependencyRef);

      if (dependency) {
        const vulnerability = new Vulnerability(getRange(dependency, ecosystem), ref, dependencyData);

        const vulnerabilityDiagnostic = vulnerability.getDiagnostic();
        if (vulnerabilityDiagnostic.severity === DiagnosticSeverity.Information && !globalConfig.recommendationsEnabled) {
          return;
        }

        this.diagnostics.push(vulnerabilityDiagnostic);

        const loc = vulnerabilityDiagnostic.range.start.line + '|' + vulnerabilityDiagnostic.range.start.character;

        dependencyData.forEach(dd => {
          // TODO: we never use DiagnosticSeverity.Hint aka 3, so this always selects dd.remediationRef
          const actionRef = vulnerabilityDiagnostic.severity < 3 ? dd.remediationRef : dd.recommendationRef;
          if (actionRef) {
            this.createCodeAction(dependency, loc, actionRef, dependency.context, dd.sourceId, vulnerabilityDiagnostic);
          }

          for (const vuln of dd.issues) {
            if (vuln.id) {
              this.vulns.add(vuln.id!);
            }
          }
        });
      }
    });
  }

  /**
   * Creates a code action.
   * @param loc - Location of code action effect.
   * @param ref - The reference name of the recommended package.
   * @param context - Dependency context object.
   * @param sourceId - Source ID.
   * @param vulnerabilityDiagnostic - Vulnerability diagnostic object.
   * @private
   */
  private createCodeAction(dependency: Dependency, loc: string, ref: string, context: IPositionedContext | undefined, sourceId: string, vulnerabilityDiagnostic: Diagnostic) {
    const switchToVersion = ref.split('@')[1];
    const versionReplacementString = context ? context.value.replace(VERSION_PLACEHOLDER, switchToVersion) : switchToVersion;
    const title = `Switch to version ${switchToVersion} for ${sourceId}`;
    const codeAction = generateSwitchToRecommendedVersionAction(title, ref, versionReplacementString, vulnerabilityDiagnostic, this.diagnosticFilePath, dependency.version);
    registerCodeAction(this.diagnosticFilePath, loc, codeAction);
  }
}

/**
 * Performs diagnostics on the provided manifest file contents.
 * @param diagnosticFilePath - The path to the manifest file.
 * @param contents - The contents of the manifest file.
 * @param provider - The dependency provider of the corresponding ecosystem.
 * @returns A Promise that resolves when diagnostics are completed.
 */
async function performDiagnostics(tokenProvider: TokenProvider, diagnosticFilePath: Uri, contents: string, provider: IDependencyProvider) {
  try {
    // Define configuration options for the component analysis request
    const options: Options = {
      'TRUSTIFY_DA_TOKEN': await tokenProvider.getToken() ?? '',
      'TRUSTIFY_TELEMETRY_ID': globalConfig.telemetryId ?? '',
      'TRUSTIFY_DA_BACKEND_URL': globalConfig.backendUrl,
      'TRUSTIFY_DA_SOURCE': globalConfig.utmSource,
      'MATCH_MANIFEST_VERSIONS': globalConfig.matchManifestVersions,
      'TRUSTIFY_DA_PROXY_URL': globalConfig.exhortProxyUrl,
      'TRUSTIFY_DA_PYTHON_VIRTUAL_ENV': globalConfig.usePythonVirtualEnvironment,
      'TRUSTIFY_DA_GO_MVS_LOGIC_ENABLED': globalConfig.useGoMVS,
      'TRUSTIFY_DA_PYTHON_INSTALL_BEST_EFFORTS': globalConfig.enablePythonBestEffortsInstallation,
      'TRUSTIFY_DA_PIP_USE_DEP_TREE': globalConfig.usePipDepTree,
      'TRUSTIFY_DA_MVN_PATH': globalConfig.exhortMvnPath,
      'TRUSTIFY_DA_PREFER_MVNW': globalConfig.exhortPreferMvnw,
      'TRUSTIFY_DA_MVN_ARGS': globalConfig.exhortMvnArgs,
      'TRUSTIFY_DA_GRADLE_PATH': globalConfig.exhortGradlePath,
      'TRUSTIFY_DA_NPM_PATH': globalConfig.exhortNpmPath,
      'TRUSTIFY_DA_YARN_PATH': globalConfig.exhortYarnPath,
      'TRUSTIFY_DA_PNPM_PATH': globalConfig.exhortPnpmPath,
      'TRUSTIFY_DA_GO_PATH': globalConfig.exhortGoPath,
      'TRUSTIFY_DA_PYTHON3_PATH': globalConfig.exhortPython3Path,
      'TRUSTIFY_DA_PIP3_PATH': globalConfig.exhortPip3Path,
      'TRUSTIFY_DA_PYTHON_PATH': globalConfig.exhortPythonPath,
      'TRUSTIFY_DA_PIP_PATH': globalConfig.exhortPipPath
    };

    const dependencies = provider.collect(contents);
    const ecosystem = provider.getEcosystem();
    const dependencyMap = new DependencyMap(dependencies);

    const diagnosticsPipeline = new DiagnosticsPipeline(dependencyMap, diagnosticFilePath);
    diagnosticsPipeline.clearDiagnostics();

    const response = await executeComponentAnalysis(tokenProvider, diagnosticFilePath, provider, options);

    clearCodeActionsMap(diagnosticFilePath);

    diagnosticsPipeline.runDiagnostics(response.dependencies, ecosystem);

    // Handle license checking if enabled
    let incompatibleLicenseCount = 0;
    if (globalConfig.licenseCheckEnabled && response.licenseSummary) {
      // Extract incompatible license count for notifications
      if (response.licenseSummary.incompatibleDependencies) {
        incompatibleLicenseCount = response.licenseSummary.incompatibleDependencies.length;
      }

      // Check for license mismatch (only for ecosystems with license field support)
      const projectLicense = response.licenseSummary.projectLicense;
      if (projectLicense?.manifest && projectLicense.mismatch) {
        // Extract license field position from manifest for diagnostic underlining
        const licenseFieldPosition = provider.extractLicensePosition?.(contents);

        if (licenseFieldPosition) {
          const licenseDiagnosticsPipeline = new LicenseDiagnosticsPipeline();

          // Create diagnostic at license field position
          const licenseDiagnostic = licenseDiagnosticsPipeline.checkLicenseMismatch(
            response.licenseSummary,
            licenseFieldPosition
          );

          if (licenseDiagnostic) {
            // Add diagnostic to the diagnostics array
            diagnosticsPipeline.addLicenseDiagnostic(licenseDiagnostic);

            // Register code actions for the license mismatch
            const loc = `${licenseFieldPosition.position.line - 1}|${licenseFieldPosition.position.column - 1}`;

            // Quick fix: Update manifest with license from LICENSE file
            if (projectLicense.file) {
              const fileLicense = projectLicense.file.expression ||
                projectLicense.file.name ||
                (projectLicense.file.identifiers && projectLicense.file.identifiers.length > 0
                  ? projectLicense.file.identifiers[0].id
                  : undefined) ||
                'unknown';

              const updateManifestAction = generateUpdateManifestLicenseAction(
                fileLicense,
                licenseDiagnostic,
                diagnosticFilePath
              );
              registerCodeAction(diagnosticFilePath, loc, updateManifestAction);
            }
          }
        }
      }
    }

    diagnosticsPipeline.reportDiagnostics(response.metrics, incompatibleLicenseCount);
  } catch (error) {
    outputChannelDep.warn(`component analysis error: ${buildLogErrorMessage(error as Error)}`);
    notifications.emit('caError', {
      errorMessage: buildNotificationErrorMessage(error as Error),
      uri: diagnosticFilePath,
    });
  }
}

export { performDiagnostics };