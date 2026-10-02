import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(OUT, "RECON", "shots");
const BASE = process.argv[2] || "http://127.0.0.1:8124/";

const pw = loadPlaywright();
const browser = await launch(pw.chromium);

async function probe(url, label, vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const bad = [];
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(r.status() + " " + r.url().slice(0, 160));
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const t = (s) => (document.querySelector(s)?.textContent || "").trim().replace(/\s+/g, " ");
    return {
      lang: document.documentElement.lang,
      title: document.title,
      h1a: t("h1.x-large-heading"),
      heroCard1: t(".segment---teachers .small-heading"),
      vpH2: t(".value-prop h2.large-heading"),
      vpB1: t(".value-prop-typestack-content h3.big-heading"),
      socialH2: t(".social-proof-heading h2"),
      faqFirstQ: t(".accordion-title"),
      footerH2: t(".footer-heading h2"),
      navItems: [...document.querySelectorAll(".nav-links---hamburger a.nav-link, .nav-links---hamburger .kad-nav-link > div, .nav-links---hamburger .lang-switch")].map((e) => e.textContent.trim()).filter(Boolean),
      langSwitchHref: document.querySelector(".lang-switch")?.getAttribute("href"),
      faqCount: document.querySelectorAll(".accordion-item").length,
      faqDupCount: document.querySelectorAll(".accordionitem").length,
      slides: document.querySelectorAll(".w-slide").length,
      ix2: !!(window.Webflow && (() => { try { return !!window.Webflow.require("ix2"); } catch { return false; } })()),
      scrollHeight: document.documentElement.scrollHeight,
      sections: [...document.querySelectorAll("section")].map((s) => ({
        cls: (s.className || "").toString().slice(0, 40),
        top: Math.round(s.getBoundingClientRect().top + window.scrollY),
        h: Math.round(s.getBoundingClientRect().height),
      })),
      imgsBroken: [...document.querySelectorAll("img")].filter((i) => !(i.complete && i.naturalWidth > 0)).length,
      anyKhanmigo: /\bKhanmigo\b|Khan Academy/.test(document.body.innerText),
    };
  });

  await page.screenshot({ path: path.join(SHOTS, `${label}-full.png`), fullPage: true });
  await ctx.close();
  return { info, consoleErrors, bad };
}

const en = await probe(BASE, "agentkid-en");
const vi = await probe(BASE + "vi/", "agentkid-vi");
const mob = await probe(BASE, "agentkid-en-mobile", { width: 390, height: 844 });

for (const [label, r] of [["EN  /", en], ["VI  /vi/", vi], ["EN 390px", mob]]) {
  console.log(`\n===== ${label} =====`);
  console.log(`  lang=${r.info.lang}  scrollHeight=${r.info.scrollHeight}  ix2=${r.info.ix2}`);
  console.log(`  title: ${r.info.title}`);
  console.log(`  h1: ${r.info.h1a}`);
  console.log(`  hero card1: ${r.info.heroCard1}`);
  console.log(`  value-prop h2: ${r.info.vpH2}`);
  console.log(`  value-prop b1 h3: ${r.info.vpB1}`);
  console.log(`  social h2: ${r.info.socialH2}`);
  console.log(`  faq first q: ${r.info.faqFirstQ}`);
  console.log(`  footer h2: ${r.info.footerH2}`);
  console.log(`  nav: ${r.info.navItems.join(" | ")}`);
  console.log(`  lang-switch href: ${r.info.langSwitchHref}`);
  console.log(`  faq items=${r.info.faqCount} dup=${r.info.faqDupCount} slides=${r.info.slides} brokenImgs=${r.info.imgsBroken}`);
  console.log(`  "Khanmigo/Khan Academy" still visible in body text: ${r.info.anyKhanmigo}`);
  console.log(`  console errors: ${r.consoleErrors.length}  4xx+: ${r.bad.length}`);
  r.consoleErrors.slice(0, 5).forEach((e) => console.log("     ! " + e));
  r.bad.slice(0, 5).forEach((e) => console.log("     " + e));
}

console.log("\n===== SECTION GEOMETRY: EN vs original mirror =====");
const orig = JSON.parse(fs.readFileSync(path.join(OUT, "RECON", "compare-report.json"), "utf8")).viewports["1440x900"];
console.log("  orig scrollHeight:", orig.scrollHeight.original, " EN scrollHeight:", en.info.scrollHeight);
console.log("  cls".padEnd(30) + "orig top/h".padEnd(20) + "EN top/h".padEnd(20) + "delta");
for (let i = 0; i < en.info.sections.length; i++) {
  const a = orig.sections.original[i] || {};
  const b = en.info.sections[i] || {};
  const d = (b.top ?? 0) - (a.top ?? 0) || (b.h ?? 0) - (a.h ?? 0);
  console.log("  " + String(b.cls || a.cls).padEnd(28) + `${a.top}/${a.h}`.padEnd(20) + `${b.top}/${b.h}`.padEnd(20) + (d ? d + "  <== changed" : "0"));
}

fs.writeFileSync(path.join(OUT, "RECON", "phase2-verify.json"), JSON.stringify({ en, vi, mob }, null, 2), "utf8");
await browser.close();
