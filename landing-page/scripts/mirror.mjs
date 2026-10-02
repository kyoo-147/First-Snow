import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

// ---------------------------------------------------------------------------
// Khanmigo homepage mirror (public marketing page only)
//
//  OPEN -> INSPECT NETWORK -> CAPTURE DOM -> RETAIN CSS -> RETAIN PUBLIC JS ->
//  DOWNLOAD ORIGINAL ASSETS -> LOCALIZE PATHS -> RUN LOCALLY
//
// Faithful strategy: the site is Webflow. The deployed static assets ARE the
// source. We mirror them 1:1 and only rewrite URLs. Nothing is re-created.
// ---------------------------------------------------------------------------

const BASE = "https://www.khanmigo.ai/";
const OUT = path.resolve(import.meta.dirname, "..");
const SITE = path.join(OUT, "site");
const RECON = path.join(OUT, "RECON");
const MIRROR = "mirror/khanmigo";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Public resources required to render the homepage
const ALLOW_HOSTS = new Set([
  "www.khanmigo.ai",
  "cdn.prod.website-files.com",
  "d3e54v103j8qbb.cloudfront.net",
  "ajax.googleapis.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "unpkg.com",
]);

// Third-party only (tracking / consent / marketing) — NOT needed to render
const BLOCK_HOSTS = new Set([
  "www.googletagmanager.com",
  "cdn.cookielaw.org",
  "geolocation.onetrust.com",
  "a.omappapi.com",
  "api.omappapi.com",
]);

// --- asset categorisation (homepage area) ---------------------------------

function categorize(name) {
  const n = name.toLowerCase();
  if (n.includes("khanmigo logo")) return "brand";
  if (n.includes("frame 625094")) return "brand";
  if (n.includes("favicon")) return "icons";
  if (n.includes("caret")) return "icons";
  if (n.includes("link_out")) return "icons";
  if (n.includes("nav_menu") || n.includes("nav_close")) return "icons";
  if (n.includes("playbutton")) return "icons";
  if (n.includes("home_hero")) return "hero";
  if (n.includes("wsj") || n.includes("commonsense") || n.includes("washington_post")) return "press";
  if (n.includes("spot1")) return "teacher";
  if (n.includes("spot2")) return "learners";
  if (n.includes("spot3")) return "parents";
  if (n.includes("testimonial")) return "testimonials";
  if (n.includes("tedtalks")) return "ted";
  if (n.includes("footer_hero")) return "final-cta";
  if (n.includes("placeholder")) return "misc";
  return "misc";
}

function fontCssName(rawUrl) {
  if (rawUrl.includes("family=Lato:100,100italic")) return "google-fonts-lato-sourceserifpro.css";
  if (rawUrl.includes("Montserrat")) return "google-fonts-montserrat-poppins.css";
  if (rawUrl.includes("Source+Sans+3")) return "google-fonts-sourcesans3-lato.css";
  return "google-fonts-" + Math.abs(hash(rawUrl)) + ".css";
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function localPathFor(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = u.host;
  const name = decodeURIComponent((u.pathname.split("/").pop() || "index").trim());

  if (host === "www.khanmigo.ai") {
    // STRICT SCOPE: only the homepage route is mirrored. Other same-origin
    // routes (e.g. /es, /pt hreflang alternates) are NOT cloned. The homepage
    // document itself is fetched separately as the raw source, so its own URL
    // never appears as a sub-resource — nothing to map here.
    return null;
  }
  if (host === "cdn.prod.website-files.com") {
    if (u.pathname.includes("/css/")) return `${MIRROR}/styles/${name}`;
    if (u.pathname.includes("/js/")) return `${MIRROR}/scripts/${name}`;
    if (u.pathname.includes("/plugins/")) return `${MIRROR}/assets/misc/${name}`;
    return `${MIRROR}/assets/${categorize(name)}/${name}`;
  }
  if (host === "d3e54v103j8qbb.cloudfront.net") return `${MIRROR}/scripts/jquery-3.5.1.min.js`;
  if (host === "ajax.googleapis.com") return `${MIRROR}/scripts/webfont.js`;
  if (host === "unpkg.com") return `${MIRROR}/scripts/typer.js`;
  if (host === "fonts.googleapis.com") return `${MIRROR}/styles/${fontCssName(rawUrl)}`;
  if (host === "fonts.gstatic.com") return `${MIRROR}/fonts/files/${name}`;
  return null;
}

function isAllowed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (BLOCK_HOSTS.has(u.host)) return false;
    return ALLOW_HOSTS.has(u.host);
  } catch {
    return false;
  }
}

function isBlocked(rawUrl) {
  try {
    return BLOCK_HOSTS.has(new URL(rawUrl).host);
  } catch {
    return false;
  }
}

// --- helpers ---------------------------------------------------------------

const report = [];
function record(url, local, area, thestatus) {
  report.push({ url, local, area, status: thestatus });
}

function writeLocal(rel, buf) {
  const dest = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function relFrom(fromRel, toRel) {
  const r = path.relative(path.dirname(path.join(SITE, fromRel)), path.join(SITE, toRel));
  return r.split(path.sep).join("/");
}

function encodePath(p) {
  return p
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

// ---------------------------------------------------------------------------
// deterministic build: site/ is generated output, rebuild it from scratch
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: UA,
});
const page = await ctx.newPage();

const networkUrls = new Set();
page.on("response", (r) => networkUrls.add(r.url()));

console.log("1) Loading live homepage + full scroll (authoritative network inventory)");
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= total; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(150);
}
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

// URLs referenced by the rendered DOM (includes every srcset variant)
const domUrls = await page.evaluate(() => {
  const out = new Set();
  const abs = (u) => {
    try {
      return new URL(u, location.href).href;
    } catch {
      return null;
    }
  };
  document.querySelectorAll("[src]").forEach((e) => {
    const v = abs(e.getAttribute("src"));
    if (v) out.add(v);
  });
  document.querySelectorAll("[srcset]").forEach((e) => {
    e.getAttribute("srcset")
      .split(",")
      .forEach((part) => {
        const v = abs(part.trim().split(/\s+/)[0]);
        if (v) out.add(v);
      });
  });
  document.querySelectorAll("[poster]").forEach((e) => {
    const v = abs(e.getAttribute("poster"));
    if (v) out.add(v);
  });
  document.querySelectorAll("link[href]").forEach((e) => {
    const v = abs(e.getAttribute("href"));
    if (v) out.add(v);
  });
  document.querySelectorAll("script[src]").forEach((e) => {
    const v = abs(e.getAttribute("src"));
    if (v) out.add(v);
  });
  // og:image / twitter:image etc.
  document.querySelectorAll("meta[content]").forEach((e) => {
    const c = (e.getAttribute("content") || "").trim();
    if (/^https?:\/\//i.test(c)) {
      const v = abs(c);
      if (v) out.add(v);
    }
  });
  return [...out];
});

// raw server HTML — the real source document (Webflow renders server-side)
const htmlResp = await ctx.request.get(BASE, { headers: { "user-agent": UA } });
let rawHtml = await htmlResp.text();
fs.writeFileSync(path.join(RECON, "original-source.html"), rawHtml, "utf8");

// url() refs inside inline <style> / style attributes of the raw HTML
const inlineCssUrls = [];
for (const m of rawHtml.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
  const raw = m[2].trim();
  if (raw.startsWith("data:")) continue;
  try {
    inlineCssUrls.push(new URL(raw, BASE).href);
  } catch {}
}

const candidates = new Set([...networkUrls, ...domUrls, ...inlineCssUrls]);

console.log(`2) Downloading public homepage assets`);
const urlMap = new Map();
const localToUrl = new Map();
const pending = [...candidates].filter((u) => isAllowed(u) && u.startsWith("http"));
const downloaded = new Set();
let ok = 0;
let fail = 0;

async function download(u) {
  if (downloaded.has(u)) return;
  downloaded.add(u);
  const rel = localPathFor(u);
  if (!rel) return;
  const resp = await ctx.request.get(u, { headers: { "user-agent": UA } });
  if (!resp.ok()) {
    record(u, rel, "?", "UNAVAILABLE");
    fail++;
    return;
  }
  const buf = await resp.body();
  writeLocal(rel, buf);
  urlMap.set(u, rel);
  localToUrl.set(rel, u);
  ok++;
}

for (const u of pending) await download(u);
console.log(`   ${ok} downloaded, ${fail} unavailable`);

// second/third pass: url() references inside downloaded CSS (fonts, background images)
console.log("3) Rewriting url() refs inside stylesheets (fonts, background images)");

function pruneMissingFontFaces(css, rel) {
  return css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const m = block.match(/url\((['"]?)([^'")]+)\1\)/);
    if (!m) return block;
    const p = m[2];
    if (/^(https?:)?\/\//i.test(p) || p.startsWith("data:")) return block;
    const abs = path.resolve(path.dirname(path.join(SITE, rel)), p);
    return fs.existsSync(abs) ? block : "";
  });
}

for (let pass = 0; pass < 3; pass++) {
  const cssFiles = [...urlMap.entries()].filter(([u, rel]) => rel.endsWith(".css"));
  let changed = 0;
  for (const [origUrl, rel] of cssFiles) {
    const cssPath = path.join(SITE, rel);
    const before = fs.readFileSync(cssPath, "utf8");
    let css = before;
    const replacements = [];
    for (const m of css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
      const raw = m[2].trim();
      if (raw.startsWith("data:") || raw.startsWith("#")) continue;
      if (!/^(https?:)?\/\//i.test(raw)) continue; // already localized
      let absUrl;
      try {
        absUrl = new URL(raw, origUrl).href;
      } catch {
        continue;
      }
      if (!isAllowed(absUrl)) continue;
      if (!downloaded.has(absUrl)) await download(absUrl);
      const target = urlMap.get(absUrl);
      if (!target) continue;
      replacements.push({ from: m[0], to: `url("${relFrom(rel, target)}")` });
    }
    for (const r of replacements) css = css.split(r.from).join(r.to);
    css = pruneMissingFontFaces(css, rel);
    if (css !== before) {
      fs.writeFileSync(cssPath, css);
      changed++;
      console.log(`   ${rel}: ${replacements.length} url() refs localized`);
    }
  }
  if (!changed) break;
}

// ---------------------------------------------------------------------------
// 4) Rewrite index.html
// ---------------------------------------------------------------------------
console.log("4) Rewriting index.html -> local paths, stripping tracking");

let html = rawHtml;

// strip OneTrust consent block
html = html.replace(/<!-- OneTrust Cookies Consent Notice start[\s\S]*?<!-- OneTrust Cookies Consent Notice end[^>]*-->/gi, "");
html = html.replace(/<script[^>]*cdn\.cookielaw\.org[^>]*>\s*<\/script>/gi, "");
html = html.replace(/<link[^>]*cdn\.cookielaw\.org[^>]*>/gi, "");
html = html.replace(/<script[^>]*id="onetrust[^"]*"[^>]*>[\s\S]*?<\/script>/gi, "");
html = html.replace(/<style[^>]*id="onetrust-style"[^>]*>[\s\S]*?<\/style>/gi, "");
html = html.replace(/<div[^>]*id="onetrust-consent-sdk"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, "");
html = html.replace(/<iframe[^>]*onetrust[^>]*>[\s\S]*?<\/iframe>/gi, "");
html = html.replace(/<iframe[^>]*geolocation\.onetrust[^>]*>[\s\S]*?<\/iframe>/gi, "");

// strip Google Tag Manager
html = html.replace(/<!-- Google Tag Manager[\s\S]*?<!-- End Google Tag Manager -->/gi, "");
html = html.replace(/<script[^>]*googletagmanager\.com\/gtm\.js[^>]*>[\s\S]*?<\/script>/gi, "");
html = html.replace(/<script>\(function\(w,d,s,l,i\)\{[\s\S]*?\}\)\(window,document,'script','dataLayer','GTM-[A-Z0-9]+'\);<\/script>/gi, "");
html = html.replace(/<noscript>\s*<iframe[^>]*googletagmanager\.com\/ns\.html[^>]*>\s*<\/iframe>\s*<\/noscript>/gi, "");

// strip OptinMonster
html = html.replace(/<!-- This site is converting visitors into subscribers[\s\S]*?optinmonster\.com -->/gi, "");
html = html.replace(/<script>\(function\(d,u,ac\)[\s\S]*?omappapi\.com[\s\S]*?\)\(document,\d+,\d+\);<\/script>/gi, "");
html = html.replace(/<script[^>]*omappapi\.com[^>]*>\s*<\/script>/gi, "");
html = html.replace(/<link[^>]*omappapi\.com[^>]*>/gi, "");
html = html.replace(/<!-- OptinMonster[\s\S]*?-->/gi, "");
html = html.replace(/\s*<!--\s*\/?\s*https:\/\/optinmonster\.com\s*-->/gi, "");

// strip SRI (integrity) + crossorigin — invalid once localized
html = html.replace(/\s+integrity="[^"]*"/gi, "");
html = html.replace(/(<link[^>]+rel="stylesheet"[^>]*)\s+crossorigin="anonymous"/gi, "$1");
html = html.replace(/(<link[^>]+href="https:\/\/cdn\.prod\.website-files\.com[^>]*)\s+crossorigin="anonymous"/gi, "$1");

// drop preconnect hints to remote hosts (now local)
html = html.replace(/<link[^>]*rel="preconnect"[^>]*>/gi, "");

// localize every known remote asset URL
const pairs = [];
for (const [remote, rel] of urlMap) {
  const local = encodePath(rel);
  pairs.push([remote, local]);
  pairs.push([remote.replace(/&/g, "&amp;"), encodePath(rel).replace(/&/g, "&amp;")]);
  try {
    const dec = decodeURIComponent(remote);
    if (dec !== remote) pairs.push([dec, decodeURIComponent(local)]);
  } catch {}
}
pairs.sort((a, b) => b[0].length - a[0].length);
let rewritten = 0;
for (const [from, to] of pairs) {
  if (!html.includes(from)) continue;
  const n = html.split(from).length - 1;
  html = html.split(from).join(to);
  rewritten += n;
}
console.log(`   ${rewritten} URL references localized`);

// Root-relative links (/teachers, /learners, /parents, /writingcoach, /) are
// destinations on khanmigo.ai that are explicitly OUT OF SCOPE to clone.
// Point them at the live site so the nav still leads somewhere real instead of
// 404-ing locally. Destinations are NOT cloned.
let linkfix = 0;
html = html.replace(/(\s(?:href|action)=")\/(?!\/)([^"]*)"/gi, (m, pre, rest) => {
  linkfix++;
  return `${pre}https://www.khanmigo.ai/${rest}"`;
});
console.log(`   ${linkfix} out-of-scope internal links pointed at the live site`);

// webfont loader: keep the mirrored webfont.js but point it at local font CSS
html = html.replace(
  /<script type="text\/javascript">WebFont\.load\(\{\s*google:\s*\{[\s\S]*?\}\s*\}\);<\/script>/i,
  `<script type="text/javascript">WebFont.load({ custom: { families: ["Lato","Source Serif Pro","Montserrat","Poppins","Source Sans 3"], urls: ["${MIRROR}/styles/google-fonts-lato-sourceserifpro.css","${MIRROR}/styles/google-fonts-montserrat-poppins.css","${MIRROR}/styles/google-fonts-sourcesans3-lato.css"] } });</script>`
);

// canonical / hreflang still point at the real site — harmless, keep as links

writeLocal("index.html", Buffer.from(html, "utf8"));
// pristine, URL-localized baseline consumed by the Phase 2 content swap
fs.writeFileSync(path.join(RECON, "localized-pristine.html"), html, "utf8");

// ---------------------------------------------------------------------------
// 5) Docs
// ---------------------------------------------------------------------------
console.log("5) Writing asset manifest");

const areaFor = (rel) => {
  const m = rel.match(/assets\/([^/]+)\//);
  if (m) return m[1];
  if (rel.includes("/styles/")) return "styles";
  if (rel.includes("/scripts/")) return "scripts";
  if (rel.includes("/fonts/")) return "fonts";
  return "root";
};

const rows = [];
for (const [remote, rel] of urlMap) {
  rows.push({ rel, remote, area: areaFor(rel), status: "LOCALIZED" });
}
for (const r of report) rows.push({ rel: r.local, remote: r.url, area: areaFor(r.local || ""), status: r.status });
rows.sort((a, b) => String(a.rel || "").localeCompare(String(b.rel || "")));

if (report.length) {
  console.log("   unavailable:");
  for (const r of report) console.log("     " + r.url);
}

fs.writeFileSync(
  path.join(OUT, "RECON", "asset-map.json"),
  JSON.stringify({ generatedFrom: BASE, rows, blockedHosts: [...BLOCK_HOSTS] }, null, 2),
  "utf8"
);

const skipped = [...candidates].filter((u) => isBlocked(u));
fs.writeFileSync(path.join(OUT, "RECON", "blocked-requests.json"), JSON.stringify(skipped, null, 2), "utf8");

console.log(`   ${rows.length} mapped rows`);
console.log(`   ${skipped.length} blocked (tracking/consent) requests not mirrored`);
await browser.close();
console.log("Done.");
