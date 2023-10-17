import * as vscode from 'vscode';
import { getRedHatService, TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';

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

let telemetryServiceObj: TelemetryService = null;
async function telemetryService(context: vscode.ExtensionContext): Promise<TelemetryService> {
  if (!telemetryServiceObj) {
    const redhatService = await getRedHatService(context);
    telemetryServiceObj = await redhatService.getTelemetryService();
  }
  return telemetryServiceObj;
}

export async function record(context: vscode.ExtensionContext, eventName: string, properties?: object) {
  const telemetryServiceObj: TelemetryService = await telemetryService(context);
  const event: TelemetryEvent = {
    type: 'track',
    name: eventName,
    properties: properties
  };
  await telemetryServiceObj?.send(event);
}

export async function startUp(context: vscode.ExtensionContext) {
  const telemetryServiceObj: TelemetryService = await telemetryService(context);
  await telemetryServiceObj?.sendStartupEvent();
}