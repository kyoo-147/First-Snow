import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(OUT, "RECON", "shots");
const BASE = process.argv[2] || "http://127.0.0.1:8124/";
const LABEL = process.argv[3] || "en";

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= h; y += 600) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(110);
}
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

const clips = [
  ["header-hero", 0, 0, 1440, 1100],
  ["audience-cards", 0, 780, 1440, 700],
  ["endorsers", 0, 1400, 1440, 420],
  ["valueprop-1", 0, 1700, 1440, 900],
  ["principles", 0, 2750, 1440, 900],
  ["faq", 0, 3400, 1440, 1000],
  ["video-footer", 0, 4250, 1440, 1500],
];

for (const [name, x, y, w, hh] of clips) {
  await page.screenshot({ path: path.join(SHOTS, `crop-${LABEL}-${name}.png`), fullPage: true, clip: { x, y, width: w, height: hh } });
}
console.log("wrote", clips.length, "crops for", LABEL);
await browser.close();
