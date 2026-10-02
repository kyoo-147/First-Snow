import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..");
const src = path.join(OUT, "site", "index.html");
const dst = path.join(OUT, "RECON", "localized-pristine.html");

const html = fs.readFileSync(src, "utf8");
if (/AgentKid/.test(html)) {
  console.error("Refusing: site/index.html already contains AgentKid copy. Re-run scripts/mirror.mjs first.");
  process.exit(1);
}
fs.writeFileSync(dst, html, "utf8");
console.log(`snapshot -> ${dst} (${(html.length / 1024).toFixed(1)} KB)`);
