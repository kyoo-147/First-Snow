import fs from "node:fs";
import path from "node:path";

const r = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "..", "RECON", "compare-report.json"), "utf8"));

const vp = process.argv[2] || "1440x900";
const d = r.viewports[vp];
console.log(`=== SECTION GEOMETRY @ ${vp} (original vs clone) ===\n`);
console.log("  cls".padEnd(42) + "orig top/h".padEnd(20) + "clone top/h".padEnd(20) + "delta");
console.log("  " + "-".repeat(96));
const n = Math.max(d.sections.original.length, d.sections.clone.length);
for (let i = 0; i < n; i++) {
  const a = d.sections.original[i] || {};
  const b = d.sections.clone[i] || {};
  const delta = (b.top ?? 0) - (a.top ?? 0) || (b.h ?? 0) - (a.h ?? 0);
  const flag = delta ? "  <== DIFF" : "";
  console.log(
    "  " +
      String(a.cls || "?").slice(0, 38).padEnd(40) +
      `${a.top}/${a.h}`.padEnd(20) +
      `${b.top}/${b.h}`.padEnd(20) +
      delta +
      flag
  );
}

console.log(`\n=== IMAGES @ ${vp} ===`);
for (let i = 0; i < Math.max(d.images.original.length, d.images.clone.length); i++) {
  const a = d.images.original[i] || {};
  const b = d.images.clone[i] || {};
  const same = a.w === b.w && a.h === b.h && a.loaded === b.loaded;
  console.log(
    `  ${String(a.src || "?").slice(0, 58).padEnd(60)} orig ${a.w}x${a.h}${a.loaded ? "" : " BROKEN"}   clone ${b.w}x${b.h}${b.loaded ? "" : " BROKEN"}${same ? "" : "   <== DIFF"}`
  );
}

console.log("\n=== HEADINGS delta (font/size/pos) ===");
let n2 = 0;
for (let i = 0; i < Math.max(d.headings ? d.headings.original.length : 0, d.headings ? d.headings.clone.length : 0); i++) {
  const a = d.headings.original[i];
  const b = d.headings.clone[i];
  if (!a || !b) continue;
  if (a.fontSize !== b.fontSize || a.top !== b.top || a.h !== b.h || a.fontFamily !== b.fontFamily || a.color !== b.color) {
    n2++;
    console.log(`  [${a.tag}] "${a.text.slice(0, 48)}"`);
    console.log(`      orig  size=${a.fontSize} lh=${a.lineHeight} font=${a.fontFamily} color=${a.color} top=${a.top} h=${a.h}`);
    console.log(`      clone size=${b.fontSize} lh=${b.lineHeight} font=${b.fontFamily} color=${b.color} top=${b.top} h=${b.h}`);
  }
}
if (!n2) console.log("  (all headings identical)");
