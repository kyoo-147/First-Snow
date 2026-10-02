import fs from "node:fs";
import path from "node:path";

const p = path.resolve(import.meta.dirname, "..", "RECON", "compare-report.json");
if (!fs.existsSync(p)) {
  console.log("NO REPORT");
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(p, "utf8"));

console.log(`original: ${r.original}`);
console.log(`clone:    ${r.clone}\n`);
console.log("viewport      scrollH(o/c)   Δpx     score%    err(o/c)  bad4xx  imgs(o/c)  broken(o/c)  faq  slides");
console.log("-".repeat(118));
for (const [name, v] of Object.entries(r.viewports)) {
  const sh = `${v.scrollHeight.original}/${v.scrollHeight.clone}`;
  const cc = v.counters;
  console.log(
    name.padEnd(13) +
      sh.padEnd(14) +
      String(v.pixel.diffPixels).padEnd(8) +
      String(v.pixel.score).padEnd(10) +
      `${v.consoleErrors.original.length}/${v.consoleErrors.clone.length}`.padEnd(10) +
      String(v.badResponses.clone.length).padEnd(8) +
      `${cc.original.images}/${cc.clone.images}`.padEnd(11) +
      `${cc.original.imagesBroken}/${cc.clone.imagesBroken}`.padEnd(13) +
      `${cc.original.faqItems}/${cc.clone.faqItems}`.padEnd(5) +
      `${cc.original.slides}/${cc.clone.slides}`
  );
}

console.log("\n=== ANY CLONE CONSOLE ERRORS ===");
let any = false;
for (const [name, v] of Object.entries(r.viewports)) {
  if (v.consoleErrors.clone.length) {
    any = true;
    console.log(`\n[${name}]`);
    [...new Set(v.consoleErrors.clone)].forEach((e) => console.log("  ! " + e.slice(0, 200)));
  }
}
if (!any) console.log("(none)");

console.log("\n=== ANY CLONE BAD (4xx/5xx) RESPONSES ===");
let anyBad = false;
for (const [name, v] of Object.entries(r.viewports)) {
  if (v.badResponses.clone.length) {
    anyBad = true;
    console.log(`\n[${name}]`);
    [...new Set(v.badResponses.clone)].forEach((e) => console.log("  " + e.slice(0, 200)));
  }
}
if (!anyBad) console.log("(none)");

console.log("\n=== ORIGINAL BAD RESPONSES (baseline brokenness) ===");
const allOrig = new Set();
for (const v of Object.values(r.viewports)) v.badResponses.original.forEach((e) => allOrig.add(e));
[...allOrig].forEach((e) => console.log("  " + e.slice(0, 200)));

console.log("\n=== H1 / BODY FONT (1440) ===");
const d = r.viewports["1440x900"];
if (d) {
  console.log("  original h1:", JSON.stringify(d.h1.original));
  console.log("  clone    h1:", JSON.stringify(d.h1.clone));
  console.log("  original body font:", d.bodyFont.original);
  console.log("  clone    body font:", d.bodyFont.clone);
}
