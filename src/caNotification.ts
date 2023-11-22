'use strict';

interface CANotificationData {
  errorMessage: string;
  done: boolean;
  uri: string;
  diagCount: number;
  vulnCount: Map<string, number>;
}

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

  constructor(respData: CANotificationData) {
    this.errorMessage = respData.errorMessage || '';
    this.done = respData.done === true;
    this.uri = respData.uri;
    this.diagCount = respData.diagCount || 0;
    this.vulnCount = respData.vulnCount || new Map<string, number>();
    this.totalVulnCount = Object.values(this.vulnCount).reduce((sum, cv) => sum + cv, 0);
  }

  private singularOrPlural(num: number): string {
    return num === 1 ? CANotification.VULNERABILITY : CANotification.VULNERABILITIES;
  }

  private capitalizeEachWord(inputString: string): string {
    return inputString.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  private vulnCountText(): string {
    return this.totalVulnCount > 0 ? `${this.totalVulnCount} direct ${this.singularOrPlural(this.totalVulnCount)}` : `no ${CANotification.VULNERABILITIES}`;
  }

  private inProgressText(): string {
    return `$(${CANotification.SYNC_SPIN}) Dependency analysis in progress`;
  }

  private warningText(): string {
    return `$(${CANotification.WARNING}) ${this.vulnCountText()} found for all the providers combined`;
  }

  private defaultText(): string {
    return `$(${CANotification.SHIELD})$(${CANotification.CHECK})`;
  }

  public errorMsg(): string {
    return this.errorMessage;
  }

  public origin(): string {
    return this.uri;
  }

  public isDone(): boolean {
    return this.done;
  }

  public hasWarning(): boolean {
    return this.diagCount > 0;
  }

  public popupText(): string {
    const text: string = Object.entries(this.vulnCount)
      .map(([provider, vulnCount]) => `Found ${vulnCount} direct ${this.singularOrPlural(vulnCount)} for ${this.capitalizeEachWord(provider)} Provider.`)
      .join(' ');
    return text || this.warningText().replace(/\$\((.*?)\)/g, '');
  }

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
