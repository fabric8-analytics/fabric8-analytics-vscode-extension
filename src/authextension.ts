'use strict';

import { GlobalState } from './constants';
import * as Config from './config';
import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';

const apiConfig = Config.getApiConfig();

export const setContextData = () => {
  process.env['PROVIDE_FULLSTACK_ACTION'] = 'true';
  process.env['UTM_SOURCE'] = GlobalState.UTM_SOURCE;
  process.env['SNYK_TOKEN'] = apiConfig.exhortSnykToken;
  process.env['MATCH_MANIFEST_VERSIONS'] = apiConfig.matchManifestVersions ? 'true' : 'false';
  process.env['MVN_EXECUTABLE'] = Config.getMvnExecutable();
  process.env['NPM_EXECUTABLE'] = Config.getNpmExecutable();
  process.env['GO_EXECUTABLE'] = Config.getGoExecutable();
  process.env['PYTHON3_EXECUTABLE'] = Config.getPython3Executable();
  process.env['PIP3_EXECUTABLE'] = Config.getPip3Executable();
  process.env['PYTHON_EXECUTABLE'] = Config.getPythonExecutable();
  process.env['PIP_EXECUTABLE'] = Config.getPipExecutable();
  process.env['EXHORT_DEV_MODE'] = GlobalState.EXHORT_DEV_MODE;
};

async function setTelemetryid(context) {
  const redhatService = await getRedHatService(context);
  const redhatIdProvider = await redhatService.getIdProvider();
  const redhatUuid = await redhatIdProvider.getRedHatUUID();
  process.env['TELEMETRY_ID'] = redhatUuid;
}

export const initContextData = async context => {
  try {
    await setTelemetryid(context);

    setContextData();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
