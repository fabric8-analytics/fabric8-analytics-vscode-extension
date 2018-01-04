'use strict';

/**
 * Token and api url Stack Analysis
 */
export namespace Apiendpoint {
    export let OSIO_ACCESS_TOKEN = '';
    export let OSIO_REFRESH_TOKEN = '';
    export let STACK_API_USER_KEY = '';
    export let STACK_API_URL: string = "";
    export let OSIO_ROUTE_URL: string = "";
    export const OSIO_AUTH_URL: string = "https://auth.openshift.io/api/token/refresh";
    export const STACK_REPORT_URL: string = "https://stack-analytics-report.prod-preview.openshift.io/";
    export const THREE_SCALE_CONNECT_URL: string = "https://3scale-connect.api.prod-preview.openshift.io/";

}