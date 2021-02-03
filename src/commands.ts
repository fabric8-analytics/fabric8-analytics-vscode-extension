'use strict';

/**
 * Commonly used commands
 */
export namespace Commands {
  /**
   * Triggers Stack Analysis
   */
  export const TRIGGER_FULL_STACK_ANALYSIS =
    'extension.fabric8AnalyticsWidgetFullStack';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_STATUS_BAR =
    'extension.fabric8AnalyticsWidgetFullStackFromStatusBar';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EXPLORER =
    'extension.fabric8AnalyticsWidgetFullStackFromExplorer';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_PIE_BTN =
    'extension.fabric8AnalyticsWidgetFullStackFromPieBtn';
  export const TRIGGER_FULL_STACK_ANALYSIS_FROM_EDITOR =
    'extension.fabric8AnalyticsWidgetFullStackFromEditor';
  export const TRIGGER_LSP_EDIT = 'lsp.applyTextEdit';
  export const TRIGGER_STACK_LOGS = 'extension.fabric8AnalyticsStackLogs';
}
