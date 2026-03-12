'use strict';

import { Uri } from 'vscode';
import { applySettingNameMappings } from './utils';
import { ResponseMetrics } from './dependencyAnalysis/analysis';

/**
 * Interface representing the data structure for a Component Analysis (CA) Notification.
 */
export interface CANotificationData {
  uri: Uri;
  errorMessage?: string | null;
  done?: boolean | null;
  diagCount?: number | null;
  vulns?: Set<string> | null;
  metrics?: ResponseMetrics,
  incompatibleLicenseCount?: number | null;
}

/**
 * Provides functionality for generating a Component Analysis (CA) Notification.
 */
class CANotification {
  private readonly errorMessage: string;
  private readonly done: boolean;
  private readonly uri: Uri;
  private readonly diagCount: number;
  private readonly vulns: Set<string>;
  private readonly incompatibleLicenseCount: number;

  private static readonly VULNERABILITY = 'vulnerability';
  private static readonly VULNERABILITIES = 'vulnerabilities';
  private static readonly LICENSE = 'license';
  private static readonly LICENSES = 'licenses';

  private static readonly SYNC_SPIN = 'sync~spin';
  private static readonly WARNING = 'warning';
  private static readonly SHIELD = 'shield';
  private static readonly CHECK = 'check';

  /**
   * Creates an instance of CANotification based on the given data.
   * @param respData The data used to create the notification.
   */
  constructor(respData: CANotificationData) {
    this.errorMessage = applySettingNameMappings(respData.errorMessage || '');
    this.done = respData.done === true;
    this.uri = respData.uri || Uri.file('');
    this.diagCount = respData.diagCount || 0;
    this.vulns = respData.vulns || new Set<string>();
    this.incompatibleLicenseCount = respData.incompatibleLicenseCount || 0;
  }

  /**
   * Determines if a singular or plural form of a word should be used based on the number of vulnerabilities.
   * @param num The number of vulnerabilities to evaluate.
   * @returns The appropriate string representing either 'vulnerability' or 'vulnerabilities'.
   * @private
   */
  private singularOrPlural(num: number): string {
    return num === 1 ? CANotification.VULNERABILITY : CANotification.VULNERABILITIES;
  }

  /**
   * Determines if a singular or plural form of the word 'license' should be used.
   * @param num The number of licenses to evaluate.
   * @returns The appropriate string representing either 'license' or 'licenses'.
   * @private
   */
  private singularOrPluralLicense(num: number): string {
    return num === 1 ? CANotification.LICENSE : CANotification.LICENSES;
  }

  /**
   * Capitalizes each word in a given string.
   * @param inputString The string to be capitalized.
   * @returns The string with each word capitalized.
   * @private
   */
  private capitalizeEachWord(inputString: string): string {
    return inputString.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  /**
   * Generates text for the total vulnerability count.
   * @returns Text representing the total number of vulnerabilities.
   * @private
   */
  private vulnCountText(): string {
    return this.vulns.size > 0 ? `${this.vulns.size} direct ${this.singularOrPlural(this.vulns.size)}` : `no ${CANotification.VULNERABILITIES}`;
  }

  /**
   * Generates text for the incompatible license count.
   * @returns Text representing the number of incompatible licenses.
   * @private
   */
  private licenseCountText(): string {
    return this.incompatibleLicenseCount > 0
      ? `${this.incompatibleLicenseCount} incompatible ${this.singularOrPluralLicense(this.incompatibleLicenseCount)}`
      : '';
  }

  /**
   * Generates the text for the in-progress status.
   * @returns Text representing the in-progress status.
   * @private
   */
  private inProgressText(): string {
    return `$(${CANotification.SYNC_SPIN}) RHDA analysis in progress`;
  }

  /**
   * Generates the text for the warning status for amount of vulnerabilities and incompatible licenses found.
   * @returns Text representing the amount of vulnerabilities and incompatible licenses found.
   * @private
   */
  private warningText(): string {
    const vulnText = this.vulnCountText();
    const licenseText = this.licenseCountText();

    if (this.vulns.size > 0 && this.incompatibleLicenseCount > 0) {
      return `$(${CANotification.WARNING}) ${vulnText}, ${licenseText} found for all the providers combined`;
    } else if (this.incompatibleLicenseCount > 0) {
      return `$(${CANotification.WARNING}) ${licenseText} found for all the providers combined`;
    } else {
      return `$(${CANotification.WARNING}) ${vulnText} found for all the providers combined`;
    }
  }

  /**
   * Generates the default text for the status.
   * @returns Default text for the status.
   * @private
   */
  private defaultText(): string {
    return `$(${CANotification.SHIELD})$(${CANotification.CHECK})`;
  }

  /**
   * Retrieves the error message associated with the notification.
   * @returns The error message, if available; otherwise, an empty string.
   */
  public errorMsg(): string {
    return this.errorMessage;
  }

  /**
   * Retrieves the URI associated with the notification.
   * @returns The URI string.
   */
  public origin(): Uri {
    return this.uri;
  }

  /**
   * Checks if the analysis is done.
   * @returns A boolean value indicating if the analysis is done or not.
   */
  public isDone(): boolean {
    return this.done;
  }

  /**
   * Checks if any diagnostic have been found in the analysis.
   * @returns A boolean indicating if diagnostics have been found.
   */
  public hasWarning(): boolean {
    return this.diagCount > 0;
  }

  /**
   * Generates the text to display in the notification popup.
   * @returns The text content for the popup notification.
   */
  public popupText(): string {
    const parts: string[] = [];

    if (this.vulns.size > 0) {
      parts.push(`${this.vulns.size} direct ${this.singularOrPlural(this.vulns.size)}`);
    }

    if (this.incompatibleLicenseCount > 0) {
      parts.push(`${this.incompatibleLicenseCount} incompatible ${this.singularOrPluralLicense(this.incompatibleLicenseCount)}`);
    }

    if (parts.length > 0) {
      return `Found ${parts.join(' and ')} in ${this.uri.fsPath}.`;
    }

    return this.warningText().replace(/\$\((.*?)\)/g, '');
  }

  /**
   * Generates the text to display in the status bar.
   * @returns The text content for the status bar.
   */
  public statusText(): string {
    if (!this.isDone()) {
      return this.inProgressText();
    }
    if (this.hasWarning()) {
      return this.warningText();
    }
    return this.defaultText();
  }
}

export { CANotification };
