import { loadPlaywright, launch } from "./pw.mjs";

const BASE = process.argv[2] || "http://127.0.0.1:8124/";
const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

console.log("=== LANGUAGE SWITCHER ROUND TRIP ===");
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
console.log(`  start:  ${page.url()}  lang=${await page.evaluate(() => document.documentElement.lang)}  title="${await page.title()}"`);

await page.locator("a.lang-switch").first().click();
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
const viUrl = page.url();
const viLang = await page.evaluate(() => document.documentElement.lang);
const viH1 = await page.evaluate(() => document.querySelector("h1.x-large-heading")?.textContent.trim());
console.log(`  click:  ${viUrl}  lang=${viLang}  h1="${viH1}"`);
const viErrors = await page.evaluate(() => document.querySelectorAll("link[rel=stylesheet]").length);
console.log(`  vi stylesheets loaded: ${viErrors}`);

await page.locator("a.lang-switch").first().click();
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
const backUrl = page.url();
const backLang = await page.evaluate(() => document.documentElement.lang);
const backH1 = await page.evaluate(() => document.querySelector("h1.x-large-heading")?.textContent.trim());
console.log(`  back:   ${backUrl}  lang=${backLang}  h1="${backH1}"`);

const ok = viUrl.includes("/vi/") && viLang === "vi" && backLang === "en";
console.log(`\n  round trip works: ${ok}`);

// interactive parity on the VI page (IX2 driven FAQ + slider)
await page.goto(BASE + "vi/", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2000);
const faqBefore = await page.evaluate(() => ({
  expanded: document.querySelector(".accordion-trigger")?.getAttribute("aria-expanded"),
  h: Math.round(document.querySelector(".accordion-content")?.getBoundingClientRect().height || 0),
}));
await page.locator(".accordion-trigger").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.locator(".accordion-trigger").first().click();
await page.waitForTimeout(1200);
const faqAfter = await page.evaluate(() => ({
  expanded: document.querySelector(".accordion-trigger")?.getAttribute("aria-expanded"),
  h: Math.round(document.querySelector(".accordion-content")?.getBoundingClientRect().height || 0),
}));
console.log(`\n=== VI FAQ ACCORDION (IX2) ===`);
console.log(`  before: ${JSON.stringify(faqBefore)}`);
console.log(`  after:  ${JSON.stringify(faqAfter)}`);
console.log(`  toggled: ${faqBefore.h !== faqAfter.h}`);

const sliderBefore = await page.evaluate(() => document.querySelector(".w-slide")?.style.transform);
await page.locator(".w-slider-arrow-right").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.locator(".w-slider-arrow-right").first().click();
await page.waitForTimeout(1500);
const sliderAfter = await page.evaluate(() => document.querySelector(".w-slide")?.style.transform);
console.log(`\n=== VI SLIDER ===`);
console.log(`  before: ${sliderBefore}  after: ${sliderAfter}  advanced: ${sliderBefore !== sliderAfter}`);

await browser.close();
