#!/bin/bash


# Show command before executing
set -x

set -e

#npm install -g typescript


npm install
npm run vscode:prepublish
#npm install -g vsce
vsce package

#script:
npm test --silent