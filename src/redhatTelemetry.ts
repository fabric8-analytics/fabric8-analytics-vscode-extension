import { getTelemetryService, TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';

export enum TelemetryActions {
  componentAnalysisDone = 'component_analysis_done',
  componentAnalysisFailed = 'component_analysis_failed',
  vulnerabilityReportEditor = 'vulnerability_report_editor',
  vulnerabilityReportExplorer = 'vulnerability_report_explorer',
  vulnerabilityReportPopupOpened = 'vulnerability_report_popup_opened',
  vulnerabilityReportPopupIgnored = 'vulnerability_report_popup_ignored',
  vulnerabilityReportPieBtn = 'vulnerability_report_pie_btn',
  vulnerabilityReportStatusBar = 'vulnerability_report_status_bar',
}

let telemetryServiceObj: TelemetryService;
async function telemetryService(): Promise<TelemetryService> {
  if(!telemetryService) {
    telemetryServiceObj = await getTelemetryService('redhat.fabric8-analytics');
  }
  return telemetryServiceObj;
}

export async function record(eventName: string, properties?: object) {
  const telemetryServiceObj: TelemetryService = await telemetryService();
  let event:TelemetryEvent={
    type: 'track',
    name: eventName,
    properties: properties
  };
  await telemetryServiceObj?.send(event);
}

export async function startUp() {
  const telemetryServiceObj: TelemetryService = await telemetryService();
  await telemetryServiceObj?.sendStartupEvent();
}