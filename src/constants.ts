'use strict';
import { Commands } from "./commands";
/**
 * Commonly used constants
 */
export enum GlobalState {
  // to store the current version string to localStorage
  Version = 'fabric8Version',
  // to store the UUID string to localStorage
  UUID = 'uuid'
}

// Refer `name` from package.json
export const extensionId = 'fabric8-analytics';
// publisher.name from package.json
export const extensionQualifiedId = `redhat.${extensionId}`;
// GET request timeout
export const getRequestTimeout = 120 * 1000; // ms
// GET request polling frequency
export const getRequestPollInterval = 2 * 1000; // ms
// UTM
export const registrationURL = "https://app.snyk.io/signup/?utm_medium=Partner&utm_source=RedHat&utm_campaign=Code-Ready-Analytics-2020&utm_content=Register";

/* 
tracking event names
*/
export enum ActionName {
  componentAnalysisTriggered = 'component_analysis_triggered',
  vulnerabilityReportEditor = 'vulnerability_report_editor',
  vulnerabilityReportExplorer = 'vulnerability_report_explorer',
  vulnerabilityReportPopupOpened = 'vulnerability_report_popup_opened',
  vulnerabilityReportPopupIgnored = 'vulnerability_report_popup_ignored',
  vulnerabilityReportPieBtn = 'vulnerability_report_pie_btn',
  vulnerabilityReportStatusBar = 'vulnerability_report_status_bar',
}

/* 
action-name and command mapping
*/
export const commandsMapping = {
  vulnerabilityReportEditor : Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR,
  vulnerabilityReportExplorer : Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER,
  vulnerabilityReportPieBtn : Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN,
  vulnerabilityReportStatusBar : Commands.TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR,
}