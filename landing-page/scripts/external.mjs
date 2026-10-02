import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "site");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(root).filter((f) => /\.(html|css|js)$/i.test(f));
const urls = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  const rel = path.relative(root, f).split(path.sep).join("/");
  for (const m of txt.matchAll(/https?:\/\/[^\s"'`)\\<>]+/g)) {
    let host = "?";
    try {
      host = new URL(m[0]).host;
    } catch {}
    const key = host;
    if (!urls.has(key)) urls.set(key, { n: 0, sample: m[0], files: new Set() });
    const v = urls.get(key);
    v.n++;
    v.files.add(rel);
  }
}

console.log("=== EXTERNAL URLS STILL REFERENCED IN MIRROR ===\n");
const sorted = [...urls.entries()].sort((a, b) => b[1].n - a[1].n);
for (const [host, v] of sorted) {
  console.log(host + "  (" + v.n + " refs)");
  console.log("   e.g. " + v.sample.slice(0, 150));
  console.log("   in:   " + [...v.files].join(", ").slice(0, 200));
  console.log("");
}
if (!sorted.length) console.log("(none)");
