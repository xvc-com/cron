#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

iflow -p "运行 ./fmt.sh ，修复报警，然后再次运行，直到没有警告"
