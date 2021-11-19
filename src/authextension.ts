'use strict';

import { GlobalState } from './constants';
import fetch from 'node-fetch';
import { Config } from './config';
import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';

export module authextension {
  const apiConfig = Config.getApiConfig();
  export let setContextData: any;

  setContextData = (apiConfig) => {
    process.env['RECOMMENDER_API_URL'] =
      apiConfig.host + '/api/v2';
    process.env['THREE_SCALE_USER_TOKEN'] = apiConfig.apiKey;
    process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
    process.env['GOLANG_EXECUTABLE'] = Config.getGoExecutable();
    process.env['UTM_SOURCE'] = 'vscode';
  };

  export function setUUID(uuid) {
    process.env['UUID'] = uuid;
  }

  export async function setTelemetryid(context) {
    const redhatService = await getRedHatService(context);
    const REDHAT_UUID = await (
      await redhatService.getIdManager()
    ).getRedHatUUID();
    process.env['TELEMETRY_ID'] = REDHAT_UUID;
  }

  export const authorize_f8_analytics = async context => {
    try {
      await setTelemetryid(context);

      setContextData(apiConfig);

      let uuid = context.globalState.get(GlobalState.UUID);

      if (uuid && uuid !== '') {
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
    const url = `${apiConfig.host
      }/user?user_key=${apiConfig.apiKey}`;

    const response = await fetch(url, { method: 'POST' });
    if (response.ok) {
      let respData = await response.json();
      return respData['user_id'];
    } else {
      console.log(`Unable to get UUID: ${url} , Status: ${response.status}`);
      return null;
    }
  }
}
