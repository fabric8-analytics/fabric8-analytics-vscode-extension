'use strict';

/**
 * Commonly used commands
 */
export namespace Commands {
  /**
   * Triggers Stack Analysis
   */
  export const TRIGGER_FULL_STACK_ANALYSIS = 'extension.stackAnalysis';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR =
    'extension.stackAnalysisFromStatusBar';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER =
    'extension.stackAnalysisFromExplorer';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN =
    'extension.stackAnalysisFromPieBtn';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR =
    'extension.stackAnalysisFromEditor';
  export const TRIGGER_LSP_EDIT = 'lsp.applyTextEdit';
  export const TRIGGER_STACK_LOGS = 'extension.fabric8AnalyticsStackLogs';
}
