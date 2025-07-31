#!/usr/bin/env -S node --trace-uncaught --expose-gc --unhandled-rejections=strict --experimental-wasm-modules
import load from '@3-/nt/load.js';

import {
  dirname,
  join
} from 'path';

export var DNS_HOST = load(join(dirname(dirname(import.meta.dirname)), 'conf/ssl/DNS_HOST.nt'));
