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

export async function record(eventName: string, properties?: object) {
  const telemetryService: TelemetryService = await getTelemetryService('redhat.fabric8-analytics');
  let event:TelemetryEvent={
    type: 'track',
    name: eventName,
    properties: properties
  };
  await telemetryService?.send(event);
}

export async function startUp() {
  const telemetryService: TelemetryService = await getTelemetryService('redhat.fabric8-analytics');
  await telemetryService?.sendStartupEvent();
}

export async function shutDown() {
  const telemetryService: TelemetryService = await getTelemetryService('redhat.fabric8-analytics');
  await telemetryService?.sendShutdownEvent();
}
