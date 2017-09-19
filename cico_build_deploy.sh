#!/bin/bash

set -ex

. cico_setup.sh

install_dependencies

build_project

run_int_tests
