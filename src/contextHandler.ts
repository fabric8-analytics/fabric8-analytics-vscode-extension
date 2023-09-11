'use strict';

import { GlobalState } from './constants';
import * as config from './config';
import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry/lib';

export const loadEnvironmentData = () => {

  const apiConfig = config.getApiConfig();

  process.env['VSCEXT_PROVIDE_FULLSTACK_ACTION'] = 'true';
  process.env['VSCEXT_UTM_SOURCE'] = GlobalState.UTM_SOURCE;
  process.env['VSCEXT_EXHORT_DEV_MODE'] = GlobalState.EXHORT_DEV_MODE;
  process.env['VSCEXT_EXHORT_SNYK_TOKEN'] = apiConfig.exhortSnykToken;
  process.env['VSCEXT_MATCH_MANIFEST_VERSIONS'] = apiConfig.matchManifestVersions ? 'true' : 'false';
  process.env['VSCEXT_EXHORT_MVN_PATH'] = config.getMvnExecutable();
  process.env['VSCEXT_EXHORT_NPM_PATH'] = config.getNpmExecutable();
  process.env['VSCEXT_EXHORT_GO_PATH'] = config.getGoExecutable();
  process.env['VSCEXT_EXHORT_PYTHON3_PATH'] = config.getPython3Executable();
  process.env['VSCEXT_EXHORT_PIP3_PATH'] = config.getPip3Executable();
  process.env['VSCEXT_EXHORT_PYTHON_PATH'] = config.getPythonExecutable();
  process.env['VSCEXT_EXHORT_PIP_PATH'] = config.getPipExecutable();
};

async function setTelemetryid(context) {
  const redhatService = await getRedHatService(context);
  const redhatIdProvider = await redhatService.getIdProvider();
  const redhatUuid = await redhatIdProvider.getRedHatUUID();
  process.env['VSCEXT_TELEMETRY_ID'] = redhatUuid;
}

export const loadContextData = async context => {
  try {
    await setTelemetryid(context);

    loadEnvironmentData();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
