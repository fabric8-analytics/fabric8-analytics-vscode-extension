'use strict';
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
// UTM
export const registrationURL = 'https://app.snyk.io/signup/?utm_medium=Partner&utm_source=RedHat&utm_campaign=Code-Ready-Analytics-2020&utm_content=Register';
// URL to Snyk webpage
export const snykURL = 'https://app.snyk.io/login?utm_campaign=Code-Ready-Analytics-2020&utm_source=code_ready&code_ready=FF1B53D9-57BE-4613-96D7-1D06066C38C9';
// default dependencyAnalysisReportFilePath
export const defaultDependencyAnalysisReportFilePath = '/tmp/dependencyAnalysisReport.html';
// Red Hat GA Repository
export const redhatMavenRepository = 'https://maven.repository.redhat.com/ga/';
// Red Hat GA Repository documentation
export const redhatMavenRepositoryDocumentationURL = 'https://access.redhat.com/maven-repository';

export namespace StatusMessages {
  export const WIN_ANALYZING_DEPENDENCIES = 'Analyzing application dependencies...';
  export const WIN_GENERATING_DEPENDENCIES = 'Generating dependency analytics report...';
  export const WIN_SUCCESS_DEPENDENCY_ANALYSIS = 'Successfully generated dependency analytics report...';
  export const WIN_FAILURE_DEPENDENCY_ANALYSIS = 'Unable to generate dependency analytics report';
  export const WIN_SHOW_LOGS = 'No output channel has been created for Dependency Analytics';
  export const NO_SUPPORTED_MANIFEST = 'No supported manifest file found to be analyzed.';
}

export namespace PromptText {
  export const FULL_STACK_PROMPT_TEXT = `Open the detailed vulnerability report`;
  export const LSP_FAILURE_TEXT = `Open the output window`;
}

export namespace Titles {
  export const EXT_TITLE = `Dependency Analytics`;
  export const REPORT_TITLE = `Dependency Analytics Report`;
}