#!/usr/bin/env bash
set -e

./scripts/clean-project.sh

echo "## SCRIPT: Rebuild"

yarn
yarn update:free-proxy-list
yarn tsc
cp ./src/free-proxy-list.json ./dist/free-proxy-list.json
yarn test

echo "Project rebuilt"
