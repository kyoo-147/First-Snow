import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const FILE = process.argv[2] || path.join(OUT, "site", "index.html");
const SELECTORS = process.argv.slice(3);

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const page = await browser.newPage();
await page.goto("file:///" + FILE.replace(/\\/g, "/"), { waitUntil: "domcontentloaded" });

const pretty = (s) => s.replace(/></g, ">\n<");

for (const sel of SELECTORS) {
  const parts = sel.split("|"); // selector|maxChars
  const s = parts[0];
  const max = parseInt(parts[1] || "6000", 10);
  const res = await page.evaluate((q) => {
    const els = [...document.querySelectorAll(q)];
    return els.map((e) => e.outerHTML);
  }, s);
  console.log("\n" + "=".repeat(100));
  console.log(`SELECTOR: ${s}   (${res.length} match${res.length === 1 ? "" : "es"})`);
  console.log("=".repeat(100));
  res.slice(0, 10).forEach((h, i) => {
    console.log(`\n--- match ${i + 1} ---`);
    const out = pretty(h);
    console.log(out.length > max ? out.slice(0, max) + `\n... [truncated, total ${out.length}]` : out);
  });
}
await browser.close();
