import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const CLONE = process.argv[2] || "http://127.0.0.1:8124/";

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const results = {};

async function run(label, url) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);

  // The live site's OneTrust consent overlay covers the viewport and swallows
  // pointer events; remove it so interaction tests can reach the page.
  await page
    .evaluate(() => {
      document.querySelectorAll("#onetrust-consent-sdk, .onetrust-pc-dark-filter").forEach((e) => e.remove());
      document.documentElement.style.overflow = "auto";
    })
    .catch(() => {});

  const r = {};

  // ---- 1. Typer.js word cycling -----------------------------------------
  const readTyper = () => page.evaluate(() => (document.querySelector(".typer")?.textContent || "").trim());
  const t1 = await readTyper();
  await page.waitForTimeout(3500);
  const t2 = await readTyper();
  await page.waitForTimeout(2500);
  const t3 = await readTyper();
  r.typer = { samples: [t1, t2, t3], cycles: new Set([t1, t2, t3]).size > 1, wordsAttr: await page.evaluate(() => document.querySelector(".typer")?.getAttribute("data-words") || "") };

  // ---- 2. FAQ accordion (custom IX2 .accordion-trigger) ------------------
  const faqInfo = await page.evaluate(() => ({
    items: document.querySelectorAll(".accordion-item").length,
    triggers: document.querySelectorAll(".accordion-trigger").length,
    contents: document.querySelectorAll(".accordion-content").length,
    firstTitle: document.querySelector(".accordion-title")?.textContent.trim().replace(/\s+/g, " ").slice(0, 70) || "",
  }));
  let faqOpen = null;
  try {
    const readFaq = () =>
      page.evaluate(() => {
        const tr = document.querySelector(".accordion-trigger");
        const c = document.querySelector(".accordion-content");
        const title = tr?.querySelector(".accordion-title")?.textContent.trim().slice(0, 40);
        return {
          title,
          ariaExpanded: tr?.getAttribute("aria-expanded"),
          ariaHidden: c?.getAttribute("aria-hidden"),
          contentHeight: c ? Math.round(c.getBoundingClientRect().height) : null,
          contentDisplay: c ? getComputedStyle(c).display : null,
        };
      });
    const before = await readFaq();
    const tr = page.locator(".accordion-trigger").first();
    await tr.scrollIntoViewIfNeeded({ timeout: 15000 });
    await page.waitForTimeout(600);
    await tr.click({ timeout: 10000 });
    await page.waitForTimeout(1200);
    const after = await readFaq();
    faqOpen = { before, after, toggled: before.ariaExpanded !== after.ariaExpanded || before.contentHeight !== after.contentHeight };
  } catch (e) {
    faqOpen = { error: e.message.slice(0, 200) };
  }
  r.faq = { ...faqInfo, openTest: faqOpen };

  // ---- 3. Testimonial slider arrows --------------------------------------
  let slider = null;
  try {
    const track = () =>
      page.evaluate(() => {
        const s = document.querySelector(".w-slider-mask");
        const slides = [...document.querySelectorAll(".w-slide")];
        const active = slides.findIndex((x) => x.getAttribute("aria-hidden") !== "true");
        return { active, transform: document.querySelector(".w-slide")?.style.transform || "", count: slides.length, maskW: s?.getBoundingClientRect().width };
      });
    const b = await track();
    const arrow = page.locator(".w-slider-arrow-right").first();
    await arrow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await arrow.click({ timeout: 8000 });
    await page.waitForTimeout(1800);
    const a = await track();
    slider = { before: b, after: a, advanced: b.active !== a.active || b.transform !== a.transform };
  } catch (e) {
    slider = { error: e.message.slice(0, 160) };
  }
  r.slider = slider;

  // ---- 4. Webflow IX2 / runtime markers ---------------------------------
  r.runtime = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    hasWebflowIx: document.documentElement.classList.contains("w-mod-ix"),
    webflowGlobal: typeof window.Webflow !== "undefined",
    jquery: typeof window.jQuery !== "undefined",
    ix2Instances: window.Webflow && window.Webflow.require ? (() => { try { return !!window.Webflow.require("ix2"); } catch { return false; } })() : false,
    webfontActive: document.documentElement.classList.contains("wf-active"),
  }));

  // ---- 5. Mobile nav -----------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  let nav = null;
  try {
    const btn = page.locator(".w-nav-button").first();
    const exists = await btn.count();
    if (exists) {
      await btn.click({ timeout: 8000 });
      await page.waitForTimeout(1500);
      nav = await page.evaluate(() => {
        const overlay = document.querySelector(".w-nav-overlay");
        const menu = document.querySelector(".w-nav-menu");
        return {
          buttonExists: true,
          overlayOpen: overlay?.style.display,
          menuVisible: menu ? menu.getBoundingClientRect().height > 0 : null,
        };
      });
    } else nav = { buttonExists: false };
  } catch (e) {
    nav = { error: e.message.slice(0, 160) };
  }
  r.mobileNav = nav;

  r.consoleErrors = errors;
  await ctx.close();
  return r;
}

console.log("Testing CLONE ...");
results.clone = await run("clone", CLONE);
console.log("Testing ORIGINAL ...");
results.original = await run("original", "https://www.khanmigo.ai/");

console.log(JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(OUT, "RECON", "interaction-test.json"), JSON.stringify(results, null, 2), "utf8");
await browser.close();
