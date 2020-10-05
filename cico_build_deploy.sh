#!/bin/bash

set -ex

. cico_setup.sh

install_dependencies

build_project || fallback_build_project

run_int_tests
