#!/usr/bin/env coffee
> @3-/nt/load.js
  path > dirname join

export DNS_HOST = load join(
  dirname dirname import.meta.dirname
  'conf/ssl/DNS_HOST.nt'
)
