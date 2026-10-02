import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
}

const URL_ = arg("--url", "https://www.khanmigo.ai/");
const OUT = arg("--out", "RECON");
const LABEL = arg("--label", "original");

fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();

const net = [];
page.on("response", async (resp) => {
  try {
    const h = resp.headers();
    net.push({
      url: resp.url(),
      status: resp.status(),
      type: resp.request().resourceType(),
      ct: h["content-type"] || "",
      cl: h["content-length"] || "",
      cache: h["cache-control"] || "",
    });
  } catch {}
});

const consoleMsgs = [];
page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 500) }));
page.on("pageerror", (e) => consoleMsgs.push({ type: "pageerror", text: String(e).slice(0, 500) }));

console.log(`▸ loading ${URL_}`);
await page.goto(URL_, { waitUntil: "networkidle", timeout: 120000 }).catch((e) => console.warn("  goto:", e.message));
await page.waitForTimeout(3000);

// full scroll to trigger lazy loads / reveals
const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= scrollHeight; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(180);
}
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);

// rendered DOM
const dom = await page.evaluate(() => document.documentElement.outerHTML);
fs.writeFileSync(path.join(OUT, `${LABEL}-rendered-dom.html`), dom, "utf8");

// signals
const signals = await page.evaluate(() => {
  const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => ({
    href: l.href,
    media: l.media,
  }));
  const inlineStyleBytes = [...document.querySelectorAll("style")].reduce((a, s) => a + s.textContent.length, 0);
  const scripts = [...document.querySelectorAll("script[src]")].map((s) => ({
    src: s.src,
    type: s.type,
    async: s.async,
    defer: s.defer,
    module: s.type === "module",
  }));
  const fonts = [...document.fonts].map((f) => ({
    family: f.family,
    weight: f.weight,
    style: f.style,
    status: f.status,
    display: f.display,
  }));
  const fontFaces = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.constructor.name === "CSSFontFaceRule") fontFaces.push(rule.cssText);
      }
    } catch {}
  }
  const imgs = [...document.querySelectorAll("img")].map((i) => ({
    src: i.currentSrc || i.src,
    srcset: i.srcset || "",
    sizes: i.sizes || "",
    alt: i.alt || "",
    cls: i.className || "",
    w: i.naturalWidth,
    h: i.naturalHeight,
  }));
  const pictures = [...document.querySelectorAll("picture")].length;
  const videos = [...document.querySelectorAll("video")].map((v) => ({
    src: v.src || "",
    poster: v.poster || "",
    sources: [...v.querySelectorAll("source")].map((s) => ({ src: s.src, type: s.type })),
  }));
  const iframes = [...document.querySelectorAll("iframe")].map((f) => ({ src: f.src, title: f.title || "" }));
  const bgImages = [];
  for (const el of document.querySelectorAll("*")) {
    const bi = getComputedStyle(el).backgroundImage;
    if (bi && bi !== "none" && bi.includes("url(")) bgImages.push(bi);
  }
  return {
    title: document.title,
    lang: document.documentElement.lang,
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
    scrollHeight: document.documentElement.scrollHeight,
    stylesheets: styles,
    inlineStyleBytes,
    scripts,
    fonts,
    fontFaces,
    images: imgs,
    pictureCount: pictures,
    videos,
    iframes,
    backgroundImages: [...new Set(bgImages)],
    framework: {
      webflow: !!document.querySelector("html.w-mod-js") || !!window.Webflow,
      webflowVersion: window.Webflow && window.Webflow.env ? "present" : null,
      next: !!window.__NEXT_DATA__,
      react: !!window.React,
      gsap: !!window.gsap,
      jquery: !!window.jQuery,
    },
    metaTags: [...document.querySelectorAll("meta")].map((m) => ({
      name: m.getAttribute("name") || m.getAttribute("property") || "",
      content: (m.getAttribute("content") || "").slice(0, 300),
    })),
  };
});

fs.writeFileSync(path.join(OUT, `${LABEL}-signals.json`), JSON.stringify(signals, null, 2), "utf8");
fs.writeFileSync(path.join(OUT, `${LABEL}-network.json`), JSON.stringify(net, null, 2), "utf8");
fs.writeFileSync(path.join(OUT, `${LABEL}-console.json`), JSON.stringify(consoleMsgs, null, 2), "utf8");

// screenshots at reference viewports
const viewports = {
  1440: { width: 1440, height: 900 },
  768: { width: 768, height: 1024 },
  390: { width: 390, height: 844 },
};
for (const [name, vp] of Object.entries(viewports)) {
  await page.setViewportSize(vp);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT, "screenshots", `${LABEL}-${name}-viewport.png`),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(OUT, "screenshots", `${LABEL}-${name}-full.png`),
    fullPage: true,
  });
}

const hosts = [...new Set(net.map((r) => { try { return new URL(r.url).host; } catch { return "?"; } }))];
console.log(`▸ responses: ${net.length}`);
console.log(`▸ hosts: ${hosts.join(", ")}`);
console.log(`▸ scrollHeight: ${signals.scrollHeight}`);
console.log(`▸ images: ${signals.images.length}, stylesheets: ${signals.stylesheets.length}, scripts: ${signals.scripts.length}, fontFaces: ${signals.fontFaces.length}, fonts loaded: ${signals.fonts.length}`);
console.log(`▸ console errors: ${consoleMsgs.filter((m) => m.type === "error" || m.type === "pageerror").length}`);
await browser.close();
