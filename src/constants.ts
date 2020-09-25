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
// GET request timeout
export const getRequestTimeout = 120 * 1000; // ms
// GET request polling frequency
export const getRequestPollInterval = 2 * 1000; // ms
// UTM
export const registrationURL = "https://app.snyk.io/signup/?utm_medium=Partner&utm_source=RedHat&utm_campaign=Code-Ready-Analytics-2020&utm_content=Register";
