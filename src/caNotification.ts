'use strict';

import { applySettingNameMappings } from './utils';

/**
 * Interface representing the data structure for a Component Analysis (CA) Notification.
 */
interface CANotificationData {
  errorMessage: string;
  done: boolean;
  uri: string;
  diagCount: number;
  vulnCount: Map<string, number>;
}

/**
 * Provides functionality for generating a Component Analysis (CA) Notification.
 */
class CANotification {
  private readonly errorMessage: string;
  private readonly done: boolean;
  private readonly uri: string;
  private readonly diagCount: number;
  private readonly vulnCount: Map<string, number>;
  private readonly totalVulnCount: number;

  private static readonly VULNERABILITY = 'vulnerability';
  private static readonly VULNERABILITIES = 'vulnerabilities';

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
    this.uri = respData.uri;
    this.diagCount = respData.diagCount || 0;
    this.vulnCount = respData.vulnCount || new Map<string, number>();
    this.totalVulnCount = Object.values(this.vulnCount).reduce((sum, cv) => sum + cv, 0);
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
    return this.totalVulnCount > 0 ? `${this.totalVulnCount} direct ${this.singularOrPlural(this.totalVulnCount)}` : `no ${CANotification.VULNERABILITIES}`;
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
   * Generates the text for the warning status for amount of vulnerabilities found.
   * @returns Text representing the amount of vulnerabilities found.
   * @private
   */
  private warningText(): string {
    return `$(${CANotification.WARNING}) ${this.vulnCountText()} found for all the providers combined`;
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
  public origin(): string {
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
    const text: string = Object.entries(this.vulnCount)
      .map(([provider, vulnCount]) => `Found ${vulnCount} direct ${this.singularOrPlural(vulnCount)} for ${this.capitalizeEachWord(provider)} Provider.`)
      .join(' ');
    return text || this.warningText().replace(/\$\((.*?)\)/g, '');
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
