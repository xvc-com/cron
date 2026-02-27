#!/usr/bin/env bun

import acme from "@3-/acme";

import alissl from "@3-/alissl";

import { DNS_HOST } from "./CONF.js";

import { $ } from "@3-/zx";

await (async () => {
  var MAIL, RSYNC_HOST_LI, err, err_count, org, project, ref, stdout, upload, x;
  ({ MAIL, RSYNC_HOST_LI } = process.env);
  await acme(MAIL, DNS_HOST);
  err_count = 0;
  ref = Object.entries({ alissl });
  for (x of ref) {
    [project, upload] = x;
    try {
      // baidussl
      // dogessl
      await upload();
    } catch (error) {
      err = error;
      err_count += 1;
      console.error(project, err);
    }
  }
  ({ stdout } = await $`git remote get-url origin`);
  org = stdout.trimEnd().split("/").at(-2);
  await $`mkdir -p tmp && cd tmp && rm -rf ssl && rsync -avz ~/.acme.sh/*_ecc ssl/ &&  cd ssl && git init && git add . && git add -u && git commit -minit && git branch -M main && git remote add origin git@github.com:${org}/ssl.git && git push origin main -f`;
  await Promise.all(
    RSYNC_HOST_LI.split(" ").map(async (host) => {
      try {
        await $`rsync --mkpath -avz ~/.acme.sh/*_ecc ${host}:/mnt/www/.acme.sh/ && ssh ${host} 'cmd=$(command -v openresty || command -v nginx || echo '') && if [ -n "$cmd" ]; then cmd=$(basename $cmd) && systemctl reload $cmd && systemctl restart $cmd; fi'`;
      } catch (error) {
        err = error;
        console.error(host, err);
        err_count += 1;
      }
    }),
  );
  return err_count;
})();
