#!/usr/bin/env bun

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { X509Certificate } from "crypto";

import retry from "@3-/retry";
import Freessl from "@3-/ssl/Freessl.js";
import { $ } from "@3-/zx";

import DNS from "./DNS.js";
import cdn from "./cdn.js";
import { DNS_HOST } from "./CONF.js";
import FREESSL from "../conf/ssl/FREESSL.js";

const NOW = new Date(),
  ssl = Freessl(...FREESSL),
  ensureDir = (target) => mkdirSync(target, { recursive: true }),
  gen = retry(async (dns, domain) => {
    const acme_dir = join(homedir(), `.acme.sh/${domain}_ecc`),
      crt_file = join(acme_dir, "fullchain.cer"),
      key_file = join(acme_dir, `${domain}.key`);

    if (existsSync(crt_file)) {
      const crt = readFileSync(crt_file, "utf8"),
        key = readFileSync(key_file, "utf8"),
        key_crt = [key, crt],
        expire = new Date(new X509Certificate(crt).validTo);

      if ((expire - NOW) / 864e5 > 30) {
        console.log(domain, "expire", expire.toISOString().slice(0, 10));
        return [key_crt, false];
      }
    }

    console.log(dns, domain);

    const [setTxt, rmTxt] = DNS[dns](domain),
      set_done = new Set(),
      key_crt = await ssl(
        domain,
        (prefix, val) => {
          if (set_done.has(val)) return;
          set_done.add(val);
          return setTxt("TXT", prefix, val);
        },
        rmTxt,
      );

    ensureDir(acme_dir);
    writeFileSync(key_file, key_crt[0]);
    writeFileSync(crt_file, key_crt[1]);

    return [key_crt, true];
  });

await (async () => {
  const { RSYNC_HOST_LI: rsync_host_li } = process.env,
    updates = new Map();
  let err_count = 0;

  for (const [dns, domain_li] of Object.entries(DNS_HOST)) {
    for (const domain of domain_li) {
      try {
        const [key_crt] = await gen(dns, domain);
        if (key_crt) updates.set(domain, key_crt);
      } catch (e) {
        err_count += 1;
        console.error(dns, domain, e);
      }
    }
  }

  if (updates.size > 0) {
    try {
      await cdn(updates);
    } catch (e) {
      console.error("CDN error", e);
      err_count += 1;
    }
  }

  try {
    const { stdout } = await $`git remote get-url origin`,
      trimmed_stdout = stdout.trimEnd(),
      parts = trimmed_stdout.split("/"),
      org = parts.at(-2);

    await $`mkdir -p tmp && cd tmp && rm -rf ssl && rsync -avz ~/.acme.sh/*_ecc ssl/ && cd ssl && git init && git add . && git add -u && git commit -minit && git branch -M main && git remote add origin git@github.com:${org}/ssl.git && git push origin main -f`;
  } catch (e) {
    console.error("Git error", e);
  }

  if (rsync_host_li) {
    await Promise.all(
      rsync_host_li
        .split(" ")
        .filter(Boolean)
        .map(async (host) => {
          try {
            await $`ssh ${host} "mkdir -p /mnt/www/.acme.sh/" && rsync -avz ~/.acme.sh/*_ecc ${host}:/mnt/www/.acme.sh/ && ssh ${host} 'cmd=$(command -v openresty || command -v nginx || echo "") && if [ -n "$cmd" ]; then cmd=$(basename $cmd) && systemctl reload $cmd && systemctl restart $cmd; fi'`;
          } catch (e) {
            console.error(host, e);
            err_count += 1;
          }
        }),
    );
  }

  process.exit(err_count > 0 ? 1 : 0);
})();
