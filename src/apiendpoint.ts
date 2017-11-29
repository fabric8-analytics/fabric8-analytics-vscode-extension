'use strict';

/**
 * Token and api url Stack Analysis
 */
export namespace Apiendpoint {
    export let STACK_API_TOKEN = '';
    export let OSIO_REFRESH_TOKEN = '';
    export const STACK_API_URL: string = "https://recommender.api.openshift.io/api/v1/stack-analyses";
    export const OSIO_AUTH_URL: string = "https://auth.openshift.io/api/token/refresh";
    export const OSIO_ROUTE_URL: string = "https://recommender.api.openshift.io/";
    export const STACK_REPORT_URL: string = "https://stack-analytics-report.openshift.io/";

}