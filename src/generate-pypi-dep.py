#!/usr/bin/python
# -*- coding: utf-8 -*-

import pkg_resources as pr
import json
import sys

gd = pr.get_distribution
result = list()

for i in open(sys.argv[1]):
    try:
        # get direct dependency details
        direct_dep = gd(i)
        rs = {'package': direct_dep.key, 'version': direct_dep.version}
        rs['deps'] = set()
        for j in pr.require(i):
            for k in j.requires():
                # get transitive dependency details
                transitive_dep = gd(k)
                rs['deps'].add((transitive_dep.key, transitive_dep.version))
        rs['deps'] = [{'package': p, 'version': v} for (p, v) in rs['deps']]
        result.append(rs)
    except:
        pass

output_file = sys.argv[2:3]
output_file_obj = open(output_file[0], 'w') if output_file else sys.stdout
json.dump(result, output_file_obj)
