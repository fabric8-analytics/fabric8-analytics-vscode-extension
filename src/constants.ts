'use strict';
/**
 * Commonly used constants
 */
export enum GlobalState {
  // to store the current version string to localStorage
  VERSION = 'fabric8Version',
  // to store the UTM source for tracking purposes
  UTM_SOURCE = 'vscode'
}

export enum StatusMessages {
  WIN_ANALYZING_DEPENDENCIES = 'Analyzing application dependencies...',
  WIN_GENERATING_DEPENDENCIES = 'Generating Red Hat Dependency Analytics report...',
  WIN_SUCCESS_DEPENDENCY_ANALYSIS = 'Successfully generated Red Hat Dependency Analytics report',
  WIN_FAILURE_DEPENDENCY_ANALYSIS = 'Unable to generate Red Hat Dependency Analytics report',
  WIN_SHOW_LOGS = 'No output channel has been created for Red Hat Dependency Analytics',
  NO_SUPPORTED_MANIFEST = 'No supported manifest file found to be analyzed.',
}

export enum PromptText {
  FULL_STACK_PROMPT_TEXT = `Open Red Hat Dependency Analytics Report`,
  LSP_FAILURE_TEXT = `Open the output window`,
}

export enum Titles {
  EXT_TITLE = `Red Hat Dependency Analytics`,
  REPORT_TITLE = `Red Hat Dependency Analytics Report`,
}

export const settingNameMappings: { [key: string]: string } = {
  'EXHORT_PYTHON_VIRTUAL_ENV': 'Use Python Virtual Environment'
};

// Refer `name` from package.json
export const EXTENSION_ID = 'fabric8-analytics';
// publisher.name from package.json
export const EXTENSION_QUALIFIED_ID = `redhat.${EXTENSION_ID}`;
// UTM
export const REGISTRATION_URL = 'https://app.snyk.io/signup/?utm_medium=Partner&utm_source=RedHat&utm_campaign=Code-Ready-Analytics-2020&utm_content=Register';
// Key for Snyk token secret
export const SNYK_TOKEN_KEY = 'rhda.snykToken';
// URL to Snyk webpage
export const SNYK_URL = 'https://app.snyk.io/login?utm_campaign=Code-Ready-Analytics-2020&utm_source=code_ready&code_ready=FF1B53D9-57BE-4613-96D7-1D06066C38C9';
// default Redhat Dependency Analytics report file path
export const DEFAULT_RHDA_REPORT_FILE_PATH = '/tmp/redhatDependencyAnalyticsReport.html';
// Red Hat GA Repository
export const REDHAT_MAVEN_REPOSITORY = 'https://maven.repository.redhat.com/ga/';
// Red Hat GA Repository documentation
export const REDHAT_MAVEN_REPOSITORY_DOCUMENTATION_URL = 'https://access.redhat.com/maven-repository';
// Red Hat certified container image catalog
export const REDHAT_CATALOG = 'https://catalog.redhat.com/software/containers/search';
