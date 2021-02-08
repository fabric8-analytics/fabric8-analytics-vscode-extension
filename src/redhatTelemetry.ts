import { getTelemetryService, TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';

export enum TelemetryActions {
  componentAnalysisTriggered = 'component_analysis_triggered',
  componentAnalysisFailed = 'component_analysis_failed',
  vulnerabilityReportEditor = 'vulnerability_report_editor',
  vulnerabilityReportExplorer = 'vulnerability_report_explorer',
  vulnerabilityReportPopupOpened = 'vulnerability_report_popup_opened',
  vulnerabilityReportPopupIgnored = 'vulnerability_report_popup_ignored',
  vulnerabilityReportPieBtn = 'vulnerability_report_pie_btn',
  vulnerabilityReportStatusBar = 'vulnerability_report_status_bar',
}

async function telemetryService(): Promise<TelemetryService> {
  let telemetryServiceObj: TelemetryService;
  if(telemetryService) {
    telemetryServiceObj = await getTelemetryService('redhat.fabric8-analytics');
  }
  return telemetryServiceObj;
}

export async function record(eventName: string, properties?: object) {
  let event:TelemetryEvent={
    type: 'track',
    name: eventName,
    properties: properties
  };
  await (await telemetryService())?.send(event);
}

export async function startUp() {
  await (await telemetryService())?.sendStartupEvent();
}

export async function shutDown() {
  await (await telemetryService())?.sendShutdownEvent();
}
