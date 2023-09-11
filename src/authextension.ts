'use strict';

import { GlobalState } from './constants';
import { Config } from './config';
import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';

export module authextension {
  const apiConfig = Config.getApiConfig();
  export let setContextData: any;

  setContextData = (apiConfig) => {
    process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
    process.env['UTM_SOURCE'] = GlobalState.UtmSource;
    process.env['SNYK_TOKEN'] = apiConfig.exhortSnykToken;
    process.env['MVN_EXECUTABLE'] = Config.getMvnExecutable();
    process.env['NPM_EXECUTABLE'] = Config.getNpmExecutable();
    process.env['GO_EXECUTABLE'] = Config.getGoExecutable();
    process.env['EXHORT_DEV_MODE'] = GlobalState.ExhortDevMode;
  };

  export async function setTelemetryid(context) {
    const redhatService = await getRedHatService(context);
    const redhatIdProvider = await redhatService.getIdProvider();
    const redhatUuid = await redhatIdProvider.getRedHatUUID();
    process.env['TELEMETRY_ID'] = redhatUuid;
  }

  export const authorize_f8_analytics = async context => {
    try {
      await setTelemetryid(context);

      setContextData(apiConfig);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

}
