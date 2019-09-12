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
  export const PYPI_INTERPRETOR_CMD = `
import pkg_resources as pr;import json,sys;gd=pr.get_distribution;res=list();
for i in open(sys.argv[1]):
    try:
        rs={};I=gd(i);rs["package"]=I.key;rs["version"]=I.version;rs["deps"]=set();
        for j in pr.require(i):
            for k in j.requires():
                K=gd(k);rs["deps"].add((K.key, K.version))
        rs["deps"]=[{"package":p,"version":v}for p,v in rs["deps"]];res.append(rs)
    except: pass
a=sys.argv[2:3]
op=open(a[0],"w")if a else sys.stdout
json.dump(res,op)`;
  export const PYPI_FAILURE = `Looks like there are some problem with manifest file or python interpreter is not set`;
}
