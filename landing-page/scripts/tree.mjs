import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", process.argv[2] || "site");

function walk(dir, base = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else out.push({ rel, size: fs.statSync(path.join(dir, e.name)).size });
  }
  return out;
}

const files = walk(root).sort((a, b) => a.rel.localeCompare(b.rel));
let total = 0;
let dir = "";
for (const f of files) {
  total += f.size;
  const d = f.rel.split("/").slice(0, -1).join("/");
  if (d !== dir) {
    dir = d;
    console.log("\n  [" + (dir || "/") + "]");
  }
  console.log("    " + f.rel.split("/").pop().padEnd(72) + (f.size / 1024).toFixed(1).padStart(9) + " KB");
}
console.log("\n  TOTAL: " + files.length + " files, " + (total / 1024 / 1024).toFixed(2) + " MB");
