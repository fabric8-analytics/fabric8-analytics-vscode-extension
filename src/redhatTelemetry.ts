import * as vscode from 'vscode';
import { getRedHatService, TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';

/**
 * Actions to be recorded for telemetry purposes.
 */
enum TelemetryActions {
  componentAnalysisDone = 'component_analysis_done',
  componentAnalysisFailed = 'component_analysis_failed',
  vulnerabilityReportDone = 'vulnerability_report_done',
  vulnerabilityReportFailed = 'vulnerability_report_failed',
  vulnerabilityReportEditor = 'vulnerability_report_editor',
  vulnerabilityReportExplorer = 'vulnerability_report_explorer',
  vulnerabilityReportPieBtn = 'vulnerability_report_pie_btn',
  vulnerabilityReportStatusBar = 'vulnerability_report_status_bar',
  vulnerabilityReportPopupOpened = 'vulnerability_report_popup_opened',
  vulnerabilityReportPopupIgnored = 'vulnerability_report_popup_ignored',
  componentAnalysisVulnerabilityReportQuickfixOption = 'component_analysis_vulnerability_report_quickfix_option',
  componentAnalysisRecommendationAccepted = 'component_analysis_recommendation_accepted',
}

let telemetryServiceObj: TelemetryService = null;

/**
 * Retrieves the telemetry service.
 * @param context The extension context.
 * @returns A promise resolving to the telemetry service.
 */
async function telemetryService(context: vscode.ExtensionContext): Promise<TelemetryService> {
  if (!telemetryServiceObj) {
    const redhatService = await getRedHatService(context);
    telemetryServiceObj = await redhatService.getTelemetryService();
  }
  return telemetryServiceObj;
}

/**
 * Records a telemetry event.
 * @param context The extension context.
 * @param eventName The action name of the event.
 * @param properties Additional properties and data for the event (optional).
 * @returns A promise that resolves once the even has been sent.
 */
async function record(context: vscode.ExtensionContext, eventName: string, properties?: object) {
  telemetryServiceObj = await telemetryService(context);
  const event: TelemetryEvent = {
    type: 'track',
    name: eventName,
    properties: properties
  };
  await telemetryServiceObj?.send(event);
}

/**
 * Sends a startup event for telemetry.
 * @param context The extension context.
 * @returns A promise that resolves once the even has been sent.
 */
async function startUp(context: vscode.ExtensionContext) {
  telemetryServiceObj = await telemetryService(context);
  await telemetryServiceObj?.sendStartupEvent();
}

/**
 * Retrieves the telemetry ID.
 * @param context The extension context.
 * @returns A promise resolving to the telemetry ID.
 */
async function getTelemetryId(context) {
  const redhatService = await getRedHatService(context);
  const redhatIdProvider = await redhatService.getIdProvider();
  const telemetryId = await redhatIdProvider.getRedHatUUID();
  return telemetryId;
}

export { TelemetryActions, record, startUp, getTelemetryId };