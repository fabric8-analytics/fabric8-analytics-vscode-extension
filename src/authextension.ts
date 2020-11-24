'use strict';

import { Apiendpoint } from './apiendpoint';
import { stackAnalysisServices } from './stackAnalysisService';
import { GlobalState } from './constants';
import fetch from 'node-fetch'
import { Utils } from './Utils';

export module authextension {
  export let setContextData: any;

  setContextData = (context_f8_access_routes, context_f8_3scale_user_key) => {
    Apiendpoint.STACK_API_URL = Apiendpoint.STAGE_API_URL + '/api/v2/';
    Apiendpoint.STACK_API_USER_KEY = Apiendpoint.STAGE_THREE_SCALE_USER_TOKEN;
    Apiendpoint.OSIO_ROUTE_URL = Apiendpoint.STAGE_API_URL;
    process.env['RECOMMENDER_API_URL'] =
      Apiendpoint.STAGE_API_URL + '/api/v2';
    process.env['THREE_SCALE_USER_TOKEN'] = Apiendpoint.STAGE_THREE_SCALE_USER_TOKEN;
    process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
    process.env['GOLANG_EXECUTABLE'] = Utils.getGoExecutable();
  };

  export function setUUID(uuid) {
    process.env['UUID'] = uuid;
  };

  export const authorize_f8_analytics = async context => {
    try {
      let context_f8_access_routes = context.globalState.get(
        'f8_access_routes'
      );
      let context_f8_3scale_user_key = context.globalState.get(
        'f8_3scale_user_key'
      );

      if (context_f8_access_routes && context_f8_3scale_user_key) {
        setContextData(context_f8_access_routes, context_f8_3scale_user_key);
      } else {
        let respData = await get_3scale_routes(context);
        if (!respData) {
          return false;
        }
      }

      let uuid = context.globalState.get(GlobalState.UUID);

      if (uuid && uuid != '') {
        setUUID(uuid);
      } else {
        uuid = await getUUID();
        if (uuid) {
          context.globalState.update(GlobalState.UUID, uuid);
          setUUID(uuid);
        }
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  export async function getUUID(): Promise<string> {
    const url = `${Apiendpoint.OSIO_ROUTE_URL
      }/user?user_key=${Apiendpoint.STACK_API_USER_KEY}`;

    const response = await fetch(url, { method: 'POST' });
    if (response.ok) {
      let respData = await response.json();
      return respData['user_id'];
    } else {
      console.log(`Unable to get UUID: ${url} , Status: ${response.status}`);
      return null;
    }
  }

  export const get_3scale_routes = context => {
    return new Promise((resolve, reject) => {
      let options = {};
      options['uri'] = `${Apiendpoint.THREE_SCALE_CONNECT_URL
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
