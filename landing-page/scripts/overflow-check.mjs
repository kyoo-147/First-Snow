import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const BASE = process.argv[2] || "http://127.0.0.1:8124/";
const pw = loadPlaywright();
const browser = await launch(pw.chromium);

const VIEWPORTS = [
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2500);

console.log("=== HORIZONTAL OVERFLOW CHECK (document level) ===");
for (const [w, h] of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const over = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (rect.right > de.clientWidth + 1) {
        over.push({
          cls: (el.className || "").toString().slice(0, 50),
          tag: el.tagName.toLowerCase(),
          right: Math.round(rect.right),
        });
      }
    }
    return {
      docScrollW: de.scrollWidth,
      docClientW: de.clientWidth,
      hOverflow: de.scrollWidth > de.clientWidth + 1,
      offenders: over.slice(0, 6),
    };
  });
  const flag = r.hOverflow ? "  <== HORIZONTAL OVERFLOW" : "";
  console.log(`  ${String(w).padStart(4)}px  scrollW=${r.docScrollW} clientW=${r.docClientW}${flag}`);
  if (r.offenders.length) r.offenders.forEach((o) => console.log(`        ${o.tag}.${o.cls} right=${o.right}`));
}

// ---- does every typer word fit the hero headline? -------------------------
console.log("\n=== TYPER WORD FIT TEST (worst-case wrapping) ===");
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const span = document.querySelector(".typer");
    if (!span) return { error: "no typer" };
    const words = (span.getAttribute("data-words") || "").split(",").filter(Boolean);
    const host = span.parentElement; // the h1
    const out = [];
    const original = span.textContent;
    for (const word of words) {
      span.textContent = word;
      const r = span.getBoundingClientRect();
      out.push({ word, w: Math.round(r.width), hostW: Math.round(host.getBoundingClientRect().width), lines: Math.round(r.height / parseFloat(getComputedStyle(host).lineHeight)) });
    }
    span.textContent = original;
    return { out, hostW: Math.round(host.getBoundingClientRect().width) };
  });
  if (res.error) {
    console.log(`  ${w}px: ${res.error}`);
    continue;
  }
  const widest = res.out.reduce((a, b) => (b.w > a.w ? b : a), res.out[0]);
  console.log(`  ${String(w).padStart(4)}px  h1 width=${res.hostW}  widest word="${widest.word}" (${widest.w}px, ~${widest.lines} line(s))`);
  const wrapped = res.out.filter((o) => o.lines > 1);
  if (wrapped.length) console.log(`        wraps to >1 line: ${wrapped.map((o) => `"${o.word}"`).join(", ")}`);
}

// ---- body text overflow inside its own container --------------------------
console.log("\n=== CLIPPED TEXT CHECK (scrollWidth > clientWidth on text elements) ===");
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);
const clipped = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("h1,h2,h3,p,div,span,a")) {
    if (el.children.length) continue;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      const cs = getComputedStyle(el);
      if (cs.overflow === "visible" && cs.textOverflow !== "ellipsis") continue;
      out.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40), t: el.textContent.trim().slice(0, 50), sw: el.scrollWidth, cw: el.clientWidth });
    }
  }
  return out.slice(0, 10);
});
console.log(clipped.length ? "" : "  (none)");
clipped.forEach((c) => console.log(`  ${c.tag}.${c.cls} "${c.t}" scrollW=${c.sw} clientW=${c.cw}`));

await browser.close();
