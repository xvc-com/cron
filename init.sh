#!/usr/bin/env bash

DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -ex

if [ ! -d "conf" ]; then
  git clone -b dev --depth=1 $(git remote get-url origin | sed 's/\.git$//')-conf.git conf
fi

find . -name "package.json" -not -path "*/node_modules/*" -print0 | while IFS= read -r -d '' pkg_file; do
  dir=$(dirname "$pkg_file")
  (
    cd "$dir" && echo "$(pwd)" && ncu -u && rm -f bun.lock && bun i
  )
done
