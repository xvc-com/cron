#!/usr/bin/env bash

DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR

set -e
if [ -n "$1" ]; then
  PROJECT=$1
else
  echo "USAGE : $0 project_name"
  exit 1
fi

set -a
if [ -d "conf/$PROJECT" ]; then
  for f in conf/$PROJECT/*.env; do . $f; done
fi
set +a

set -x

cd $PROJECT

bun i

NODE_ENV=production node main.js
