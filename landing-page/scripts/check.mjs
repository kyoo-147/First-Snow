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

const files = walk(root);
const htmlCss = files.filter((f) => /\.(html|css)$/i.test(f));

const missing = [];
const external = new Map();

for (const f of htmlCss) {
  const rel = path.relative(root, f).split(path.sep).join("/");
  const txt = fs.readFileSync(f, "utf8");

  const check = (ref, kind) => {
    const r = ref.trim();
    if (!r || r.startsWith("data:") || r.startsWith("#") || r.startsWith("mailto:") || r.startsWith("javascript:")) return;
    if (/^(https?:)?\/\//i.test(r)) {
      let h = "?";
      try {
        h = new URL(r, "https://x/").host;
      } catch {}
      external.set(h, (external.get(h) || 0) + 1);
      return;
    }
    if (r.startsWith("/")) {
      missing.push({ rel, ref: r, kind, why: "absolute path (breaks under subpath serving)" });
      return;
    }
    let r2 = r.split("?")[0].split("#")[0];
    try {
      r2 = decodeURIComponent(r2);
    } catch {}
    const target = path.resolve(path.dirname(f), r2);
    if (!fs.existsSync(target)) missing.push({ rel, ref: r, kind, why: "file not found" });
  };

  if (f.endsWith(".html")) {
    for (const m of txt.matchAll(/\b(?:src|href|poster)="([^"]+)"/gi)) check(m[1], "html-attr");
    for (const m of txt.matchAll(/\bsrcset="([^"]+)"/gi)) {
      m[1].split(",").forEach((part) => check(part.trim().split(/\s+/)[0], "srcset"));
    }
    for (const m of txt.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) check(m[2], "inline-css");
  } else {
    for (const m of txt.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) check(m[2], "css-url");
  }
}

console.log("=== BROKEN / NON-RESOLVING LOCAL REFERENCES ===");
if (!missing.length) console.log("(none)");
for (const m of missing.slice(0, 60)) console.log(`  ${m.why.padEnd(42)} [${m.kind}] ${m.ref}\n      in ${m.rel}`);
if (missing.length > 60) console.log(`  ... +${missing.length - 60} more`);

console.log("\n=== STILL-EXTERNAL HOSTS ===");
[...external.entries()].sort((a, b) => b[1] - a[1]).forEach(([h, n]) => console.log("  " + h.padEnd(34) + n + " refs"));
