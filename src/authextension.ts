'use strict';

import { GlobalState } from './constants';
import fetch from 'node-fetch';
import * as crypto from "crypto";
import { Config } from './config';

export module authextension {
  const apiConfig = Config.getApiConfig();
  export let setContextData: any;

  setContextData = (apiConfig) => {
    process.env['RECOMMENDER_API_URL'] =
      apiConfig.host + '/api/v2';
    process.env['THREE_SCALE_USER_TOKEN'] = apiConfig.apiKey;
    process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
    process.env['GOLANG_EXECUTABLE'] = Config.getGoExecutable();
    process.env['user_agent'] = 'vs-code';
  };

  export function setUUID(uuid) {
    process.env['UUID'] = uuid;
    console.log(uuid)
    console.log("...................................................")
  }

  export function setManifestHash(manifest_path) {
    //process.env['manifest_hash'] = crypto
    //.createHash("sha1").update(manifest_path).digest("hex");
    process.env['manifest_hash'] = manifest_path
    console.log(manifest_path)
    console.log("...................................................")
  }

  export const authorize_f8_analytics = async context => {
    try {
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
