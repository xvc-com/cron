import cdn from "./cdn.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const domain = "xvc.com";
const acme_dir = join(homedir(), `.acme.sh/${domain}_ecc`);
const crt_file = join(acme_dir, "fullchain.cer");
const key_file = join(acme_dir, `${domain}.key`);

if (existsSync(crt_file)) {
    const crt = readFileSync(crt_file, "utf8");
    const key = readFileSync(key_file, "utf8");
    const updates = new Map();
    updates.set(domain, [key, crt]);
    
    console.log("Pushing xvc.com cert to CDN...");
    await cdn(updates).catch(console.error);
    console.log("Done");
} else {
    console.log("Certificate files not found!");
}
