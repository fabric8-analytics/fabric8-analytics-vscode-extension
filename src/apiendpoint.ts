'use strict';

/**
 * Token and api url Stack Analysis
 */
export namespace Apiendpoint {
    export let OSIO_ACCESS_TOKEN = '';
    export let OSIO_REFRESH_TOKEN = '';
    export let STACK_API_USER_KEY = '';
    export let STACK_API_URL: string = '';
    export let OSIO_ROUTE_URL: string = '';
    export const OSIO_AUTH_URL: string = 'https://auth.openshift.io/api/token/refresh';
    export const STACK_REPORT_URL: string = 'https://stack-analytics-report.openshift.io/';
    export const THREE_SCALE_CONNECT_URL: string = 'https://f8a-connect-api-2445582058137.production.gw.apicast.io/';
    export const THREE_SCALE_CONNECT_KEY: string = 'ad467b765e5c8a8a5ca745a1f32b8487';

}