'use strict';

/**
 * Commonly used commands
 */
export namespace Commands {
  /**
   * Triggers Stack Analysis
   */
  export const TRIGGER_FULL_STACK_ANALYSIS = 'fabric8.stackAnalysis';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR =
    'fabric8.stackAnalysisFromStatusBar';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER =
    'fabric8.stackAnalysisFromExplorer';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN =
    'fabric8.stackAnalysisFromPieBtn';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR =
    'fabric8.stackAnalysisFromEditor';
  export const TRIGGER_LSP_EDIT = 'lsp.applyTextEdit';
  export const TRIGGER_STACK_LOGS = 'fabric8.fabric8AnalyticsStackLogs';
}
