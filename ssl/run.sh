#!/usr/bin/env bash

DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR

set -a
for f in ../conf/ssl/*.env; do . $f; done
set +a

set -ex

./build.sh

node lib/main.js
