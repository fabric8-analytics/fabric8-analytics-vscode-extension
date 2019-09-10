'use strict';

/**
 * Commonly used messages
 */
export namespace StatusMessages {
  export const EXT_TITLE = `Dependency Analytics`;
  export const WIN_RESOLVING_DEPENDENCIES = `Resolving application dependencies...`;
  export const WIN_ANALYZING_DEPENDENCIES = `Analyzing application dependencies...`;
  export const WIN_SUCCESS_ANALYZE_DEPENDENCIES = `Generating dependency analytics report...`;
  export const WIN_FAILURE_ANALYZE_DEPENDENCIES = `Unable to generate stack report`;
  export const WIN_FAILURE_RESOLVE_DEPENDENCIES = `Unable to generate stack report`;
  export const WIN_SHOW_LOGS = `No output channel has been created for Dependency Analytics`;
  export const LSP_INITIALIZE = `Initializing Language Server`;
  export const REPORT_TAB_TITLE = `Dependency Analytics Report`;
  export const NO_SUPPORTED_MANIFEST = `No supported manifest's file found to be analyzed.`;
  export const PYPI_INTERPRETOR_PATH =
    'Provide path for python interpretor `Code/File -> Preferences -> Settings -> Workspace Settings`.For details check READMEs';
  export const PYPI_FAILURE = `Looks like there are some problem with manifest file or python interpreter is not set`;
}
