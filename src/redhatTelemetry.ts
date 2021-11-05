import {
  getRedHatService,
  TelemetryEvent,
  TelemetryService,
} from '@redhat-developer/vscode-redhat-telemetry';
import * as vscode from 'vscode';

let telemetryServiceObject: TelemetryService = null;

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

export async function record(eventName: string, properties?: object) {
  if (telemetryServiceObject) {
    let event: TelemetryEvent = {
      type: 'track',
      name: eventName,
      properties: properties,
    };
    await telemetryServiceObject?.send(event);
  }
}

export async function startUp(context: vscode.ExtensionContext) {
  const redhatService = await getRedHatService(context);
  telemetryServiceObject = await redhatService.getTelemetryService();
  telemetryServiceObject.sendStartupEvent();
}
