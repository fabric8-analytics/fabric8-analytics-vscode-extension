'use strict';

/**
 * Commonly used constants
 */
export enum GlobalState {
  // to store the current version string to localStorage
  Version = 'fabric8Version'
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
// Staging RECOMMENDER_API_URL
export const stage_recommender_api_url = "https://f8a-analytics-preview-2445582058137.staging.gw.apicast.io";
// Staging THREE_SCALE_USER_TOKEN
export const stage_three_scale_user_token = ""; //3e*