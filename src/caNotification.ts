'use strict';

interface CANotificationData {
  data: string;
  done: boolean;
  uri: string;
  diagCount: number;
  vulnCount: number;
}

class CANotification {
  private data: string;
  private done: boolean;
  private uri: string;
  private diagCount: number;
  private vulnCount: number;

  constructor(respData: CANotificationData) {
    this.data = respData.data;
    this.done = respData.done === true;
    this.uri = respData.uri;
    this.diagCount = respData.diagCount || 0;
    this.vulnCount = respData.vulnCount || 0;
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
    // replace texts inside $(..)
    return this.statusText().replace(/\$\((.*?)\)/g, '');
  }

  private vulnCountText(): string {
    const vulns = this.vulnCount;
    return vulns > 0 ? `${vulns} ${vulns === 1 ? 'vulnerability' : 'vulnerabilities'}` : `no vulnerabilities`;
  }

  public statusText(): string {
    if (!this.isDone()) {
      return `$(sync~spin) Dependency analysis in progress`;
    }
    if (this.hasWarning()) {
      return `$(warning) Found ${this.vulnCountText()}`;
    }
    return `$(shield)$(check)`;
  }
}

export { CANotification };
