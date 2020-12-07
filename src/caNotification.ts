'use strict';

class CANotification {

  private respData: any;
  constructor(respData: any) {
    this.respData = respData;
  }

  public isDone(): boolean {
    return this.respData.done === true;
  }

  public hasWarning(): boolean {
    return (this.respData.diagCount || 0) > 0;
  }

  public popupText(): string {
    return this.respData.data;
  }

  private vulnCountText(): string {
    const vulns = this.respData.vulnCount.vulnerabilityCount || 0 + this.respData.vulnCount.advisoryCount || 0;
    return vulns > 0 ? `${vulns} vulns` : ``;
  }

  private exploitCountText(): string {
    const exploits = this.respData.vulnCount.exploitCount || 0;
    return exploits > 0 ? `${exploits} exploits` : ``;
  }

  public statusText(): string {
    if (!this.isDone()) {
      return `$(sync~spin) vuln analysis in progress`;
    }
    if (this.hasWarning()) {
      const finalStatus = [this.vulnCountText(), this.exploitCountText()].filter(t => t.length > 0).join(`, `);
      return `$(warning) ${finalStatus} found in ${this.respData.depCount} deps`;
    }
    return `$(thumbsup) no vulns found in ${this.respData.depCount} deps`;
  }
}

export { CANotification };
