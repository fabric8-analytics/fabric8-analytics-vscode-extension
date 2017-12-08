'use strict';

/**
 * Token and api url Stack Analysis
 */
export namespace Apiendpoint {
    export let STACK_API_TOKEN = '';
    export let OSIO_REFRESH_TOKEN = '';
    export let STACK_API_USER_KEY = '';
    export let STACK_API_URL: string = "";
    export const OSIO_AUTH_URL: string = "https://auth.openshift.io/api/token/refresh";
    export const OSIO_ROUTE_URL: string = "https://recommender.api.openshift.io/";
    export const STACK_REPORT_URL: string = "https://stack-analytics-report.openshift.io/";
    export const THREE_SCALE_CONNECT_URL: string = "http://f8a-3scale-admin-gateway-bayesian-preview.b6ff.rh-idev.openshiftapps.com/";

}