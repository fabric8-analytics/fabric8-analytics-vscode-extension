'use strict';

import { Apiendpoint } from './apiendpoint';
import { stackAnalysisServices } from './stackAnalysisService';

export module authextension {
  export let setContextData: any;

  setContextData = (context_f8_access_routes, context_f8_3scale_user_key) => {
    Apiendpoint.STACK_API_URL = context_f8_access_routes.prod + '/api/v2/';
    Apiendpoint.STACK_API_USER_KEY = context_f8_3scale_user_key;
    Apiendpoint.OSIO_ROUTE_URL = context_f8_access_routes.prod;
    process.env['RECOMMENDER_API_URL'] =
      context_f8_access_routes.prod + '/api/v2';
    process.env['THREE_SCALE_USER_TOKEN'] = context_f8_3scale_user_key;
  };

  export const authorize_f8_analytics = context => {
    return new Promise((resolve, reject) => {
      let context_f8_access_routes = context.globalState.get(
        'f8_access_routes'
      );
      let context_f8_3scale_user_key = context.globalState.get(
        'f8_3scale_user_key'
      );
      if (context_f8_access_routes && context_f8_3scale_user_key) {
        setContextData(context_f8_access_routes, context_f8_3scale_user_key);
        resolve(true);
      } else {
        get_3scale_routes(context)
          .then(resp => {
            resolve(resp);
          })
          .catch(err => {
            reject(err);
          });
      }
    });
  };

  export const get_3scale_routes = context => {
    return new Promise((resolve, reject) => {
      let options = {};
      options['uri'] = `${
        Apiendpoint.THREE_SCALE_CONNECT_URL
        }get-endpoints?user_key=${Apiendpoint.THREE_SCALE_CONNECT_KEY}`;
      options['headers'] = { 'Content-Type': 'application/json' };

      stackAnalysisServices
        .get3ScaleRouteService(options)
        .then(respData => {
          let resp = respData;
          if (resp && resp['endpoints']) {
            context.globalState.update('f8_access_routes', resp['endpoints']);
            context.globalState.update('f8_3scale_user_key', resp['user_key']);
            let context_f8_access_routes = context.globalState.get(
              'f8_access_routes'
            );
            let context_f8_3scale_user_key = context.globalState.get(
              'f8_3scale_user_key'
            );
            setContextData(
              context_f8_access_routes,
              context_f8_3scale_user_key
            );
            resolve(true);
          }
        })
        .catch(err => {
          reject(null);
        });
    });
  };
}
