'use strict';

/**
 * Commonly used messages
 */
export namespace StatusMessages {
    export const EXT_TITLE = 'Dependency Analytics';
    export const WIN_RESOLVING_DEPENDENCIES = 'Resolving application dependencies...';
    export const WIN_ANALYZING_DEPENDENCIES = 'Analyzing application dependencies...';
    export const WIN_SUCCESS_ANALYZE_DEPENDENCIES = 'Successfully generated stack report';
    export const WIN_FAILURE_ANALYZE_DEPENDENCIES = 'Unable to generate stack report';
    export const WIN_FAILURE_RESOLVE_DEPENDENCIES = 'Unable to generate stack report';
    export const LSP_INITIALIZE = 'Initializing Language Server';
    export const REPORT_TAB_TITLE = 'Dependency Analytics Report';
    export const NO_SUPPORTED_MANIFEST = 'Cannot find supported manifest at root workspace level';
    export const PYPI_INTERPRETOR_PATH = 'Provide path for python interpretor `Code/File -> Preferences -> Settings -> Workspace Settings`.For details check READMEs';
    export const PYPI_INTERPRETOR_CMD = `-c 'exec("""\nimport pkg_resources as pr;import json,sys;gd=pr.get_distribution;res=list();\nfor i in open(sys.argv[1]):\n    try:\n        rs={};I=gd(i);rs["package"]=I.key;rs["version"]=I.version;rs["deps"]=set();\n        for j in pr.require(i):\n            for k in j.requires():\n                K=gd(k);rs["deps"].add((K.key, K.version))\n        rs["deps"]=[{"package":p,"version":v}for p,v in rs["deps"]];res.append(rs)\n    except: pass\na=sys.argv[2:3]\nop=open(a[0],"w")if a else sys.stdout\njson.dump(res,op)\n""")'`;
}
