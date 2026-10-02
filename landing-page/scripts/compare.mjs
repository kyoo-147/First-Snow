import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(OUT, "RECON", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const ORIGINAL = "https://www.khanmigo.ai/";
const CLONE = process.argv[2] || "http://127.0.0.1:8124/";

const VIEWPORTS = [
  ["375x812", { width: 375, height: 812 }],
  ["390x844", { width: 390, height: 844 }],
  ["430x932", { width: 430, height: 932 }],
  ["768x1024", { width: 768, height: 1024 }],
  ["1024x768", { width: 1024, height: 768 }],
  ["1280x800", { width: 1280, height: 800 }],
  ["1366x768", { width: 1366, height: 768 }],
  ["1440x900", { width: 1440, height: 900 }],
  ["1512x982", { width: 1512, height: 982 }],
  ["1728x1117", { width: 1728, height: 1117 }],
  ["1920x1080", { width: 1920, height: 1080 }],
];

const pw = loadPlaywright();
const browser = await launch(pw.chromium);

async function capture(url, label, vp, hideChrome) {
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + String(e).slice(0, 300)));
  page.on("requestfailed", (r) => failedRequests.push(r.url().slice(0, 200) + " :: " + (r.failure()?.errorText || "")));
  page.on("response", (r) => {
    if (r.status() >= 400) badResponses.push(r.status() + " " + r.url().slice(0, 200));
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (hideChrome) {
    await page
      .evaluate(() => {
        for (const sel of [
          "#onetrust-consent-sdk",
          ".onetrust-pc-dark-filter",
          "#ot-sdk-btn-floating",
          "iframe[name^='onetrust']",
          "#om-holder",
          ".om-holder",
          "[class*='omapp']",
        ]) {
          document.querySelectorAll(sel).forEach((e) => e.remove());
        }
        document.documentElement.style.overflow = "auto";
      })
      .catch(() => {});
  }

  // full scroll to trigger lazy loads + scroll reveals
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);

  // Deterministic capture: the hero headline runs a Typer.js word-cycling
  // animation, so the displayed word depends on capture timing. Swap the live
  // animated node for a static identical-text span on BOTH sides so the pixel
  // diff measures real structure instead of animation phase.
  await page.evaluate(() => {
    const t = document.querySelector(".typer");
    if (t) {
      const span = document.createElement("span");
      span.setAttribute("data-mirror-normalized", "typer");
      span.textContent = "teaching assistant.";
      t.replaceWith(span);
    }
  });
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height), w: Math.round(r.width) };
    };
    const sections = [...document.querySelectorAll("section")].map((s) => ({
      cls: (s.className || "").toString().slice(0, 60),
      ...rect(s),
    }));
    const headings = [...document.querySelectorAll("h1,h2,h3")].slice(0, 40).map((h) => {
      const cs = getComputedStyle(h);
      return {
        tag: h.tagName,
        text: h.textContent.trim().replace(/\s+/g, " ").slice(0, 70),
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
        color: cs.color,
        ...rect(h),
      };
    });
    const imgs = [...document.querySelectorAll("img")].map((i) => ({
      src: (i.currentSrc || i.src).split("/").pop(),
      w: i.naturalWidth,
      h: i.naturalHeight,
      loaded: i.complete && i.naturalWidth > 0,
    }));
    return {
      scrollHeight: document.documentElement.scrollHeight,
      bodyFont: getComputedStyle(document.body).fontFamily,
      sections,
      headings,
      images: imgs,
      h1: (() => {
        const e = document.querySelector("h1");
        if (!e) return null;
        const cs = getComputedStyle(e);
        return { text: e.textContent.trim().replace(/\s+/g, " ").slice(0, 120), fontSize: cs.fontSize, fontFamily: cs.fontFamily, color: cs.color, ...rect(e) };
      })(),
      counters: {
        sections: sections.length,
        images: imgs.length,
        imagesBroken: imgs.filter((i) => !i.loaded).length,
        faqItems: document.querySelectorAll(".w-dropdown").length,
        slides: document.querySelectorAll(".w-slide").length,
        tabs: document.querySelectorAll(".w-tab-link").length,
        lightbox: document.querySelectorAll(".w-lightbox").length,
      },
    };
  });

  const shot = path.join(SHOTS, `${label}-${vp.width}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  await ctx.close();
  return { metrics, consoleErrors, failedRequests, badResponses, shot };
}

// ---- pixel diff via canvas in a headless browser -------------------------
async function pixelDiff(aFile, bFile, outFile) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const toData = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const res = await page.evaluate(
    ([a, b]) =>
      new Promise((resolve) => {
        const load = (src) =>
          new Promise((r) => {
            const im = new Image();
            im.onload = () => r(im);
            im.onerror = () => r(null);
            im.src = src;
          });
        (async () => {
          const ia = await load(a);
          const ib = await load(b);
          if (!ia || !ib) return resolve({ error: "load failed" });
          const W = Math.max(ia.width, ib.width);
          const H = Math.max(ia.height, ib.height);
          const c = document.createElement("canvas");
          c.width = W;
          c.height = H;
          const g = c.getContext("2d");
          g.fillStyle = "#ffffff";
          g.fillRect(0, 0, W, H);
          g.drawImage(ia, 0, 0);
          const da = g.getImageData(0, 0, W, H).data;
          g.fillStyle = "#ffffff";
          g.fillRect(0, 0, W, H);
          g.drawImage(ib, 0, 0);
          const db = g.getImageData(0, 0, W, H).data;

          const out = g.createImageData(W, H);
          let diffPixels = 0;
          for (let i = 0; i < da.length; i += 4) {
            const d =
              Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
            const isDiff = d > 30;
            if (isDiff) diffPixels++;
            out.data[i] = isDiff ? 255 : da[i];
            out.data[i + 1] = isDiff ? 0 : da[i + 1];
            out.data[i + 2] = isDiff ? 0 : da[i + 2];
            out.data[i + 3] = 255;
          }
          g.putImageData(out, 0, 0);
          resolve({
            width: W,
            height: H,
            aSize: [ia.width, ia.height],
            bSize: [ib.width, ib.height],
            totalPixels: W * H,
            diffPixels,
            score: +(((W * H - diffPixels) / (W * H)) * 100).toFixed(3),
            dataUrl: c.toDataURL("image/png"),
          });
        })();
      }),
    [toData(aFile), toData(bFile)]
  );
  if (res.dataUrl) {
    fs.writeFileSync(outFile, Buffer.from(res.dataUrl.split(",")[1], "base64"));
    delete res.dataUrl;
  }
  await ctx.close();
  return res;
}

// ---- run -----------------------------------------------------------------
const report = { original: ORIGINAL, clone: CLONE, viewports: {} };
const target = process.argv[3] || "all";
const list = target === "all" ? VIEWPORTS : VIEWPORTS.filter(([n]) => n === target);

for (const [name, vp] of list) {
  console.log(`\n=== ${name} ===`);
  const o = await capture(ORIGINAL, "original", vp, true);
  const c = await capture(CLONE, "clone", vp, false);
  const diff = await pixelDiff(o.shot, c.shot, path.join(SHOTS, `diff-${vp.width}.png`));

  console.log(
    `  scrollHeight  original=${o.metrics.scrollHeight}  clone=${c.metrics.scrollHeight}  delta=${c.metrics.scrollHeight - o.metrics.scrollHeight}`
  );
  console.log(
    `  counters      sections ${o.metrics.counters.sections}/${c.metrics.counters.sections}  imgs ${o.metrics.counters.images}/${c.metrics.counters.images}  broken ${o.metrics.counters.imagesBroken}/${c.metrics.counters.imagesBroken}  faq ${o.metrics.counters.faqItems}/${c.metrics.counters.faqItems}  slides ${o.metrics.counters.slides}/${c.metrics.counters.slides}`
  );
  console.log(`  pixel score   ${diff.score}%  (diff px ${diff.diffPixels}/${diff.totalPixels})`);
  console.log(`  console errs  original=${o.consoleErrors.length} clone=${c.consoleErrors.length}`);
  if (c.consoleErrors.length) c.consoleErrors.slice(0, 6).forEach((e) => console.log("      ! " + e));
  console.log(`  bad responses clone=${c.badResponses.length}${c.badResponses.length ? "" : ""}`);
  if (c.badResponses.length) c.badResponses.slice(0, 10).forEach((e) => console.log("      " + e));

  report.viewports[name] = {
    viewport: vp,
    scrollHeight: { original: o.metrics.scrollHeight, clone: c.metrics.scrollHeight },
    counters: { original: o.metrics.counters, clone: c.metrics.counters },
    pixel: { score: diff.score, diffPixels: diff.diffPixels, totalPixels: diff.totalPixels, aSize: diff.aSize, bSize: diff.bSize },
    consoleErrors: { original: o.consoleErrors, clone: c.consoleErrors },
    badResponses: { original: o.badResponses, clone: c.badResponses },
    failedRequests: { original: o.failedRequests, clone: c.failedRequests },
    sections: { original: o.metrics.sections, clone: c.metrics.sections },
    h1: { original: o.metrics.h1, clone: c.metrics.h1 },
    bodyFont: { original: o.metrics.bodyFont, clone: c.metrics.bodyFont },
    images: { original: o.metrics.images, clone: c.metrics.images },
  };
}

fs.writeFileSync(path.join(OUT, "RECON", "compare-report.json"), JSON.stringify(report, null, 2), "utf8");
await browser.close();
console.log("\nreport -> RECON/compare-report.json");
