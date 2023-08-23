'use strict';

// import { GlobalState } from './constants';
import { Config } from './config';
// import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';

export module authextension {
  const apiConfig = Config.getApiConfig();
  export let setContextData: any;

  setContextData = (apiConfig) => {
    process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
    process.env['UTM_SOURCE'] = 'vscode';
    process.env['SNYK_TOKEN'] = apiConfig.exhortSnykToken;
    process.env['GOLANG_EXECUTABLE'] = Config.getGoExecutable();
    process.env['MVN_EXECUTABLE'] = Config.getMavenExecutable();
  };

  // export async function setTelemetryid(context) {
  //   const redhatService = await getRedHatService(context);
  //   const redhatIdProvider = await redhatService.getIdProvider();
  //   const REDHAT_UUID = await redhatIdProvider.getRedHatUUID();
  //   process.env['TELEMETRY_ID'] = REDHAT_UUID;
  // }

  export const authorize_f8_analytics = async context => {
    try {
      // await setTelemetryid(context);

      setContextData(apiConfig);

      // let uuid = context.globalState.get(GlobalState.UUID);

      // if (uuid && uuid !== '') {
      //   process.env['UUID'] = uuid;
      // }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

}
