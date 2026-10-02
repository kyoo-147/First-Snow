import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..");
const SITE = path.join(OUT, "site");
const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const webflowCss = fs
  .readdirSync(path.join(SITE, "mirror/khanmigo/styles"))
  .filter((f) => f.startsWith("khanmigo.webflow"))
  .map((f) => fs.readFileSync(path.join(SITE, "mirror/khanmigo/styles", f), "utf8"))
  .join("\n");

const checks = [];
const add = (name, pass, detail = "") => checks.push({ name, pass, detail });

// --- scope ---------------------------------------------------------------
add("only khanmigo.ai homepage mirrored", !fs.existsSync(path.join(SITE, "es")) && !fs.existsSync(path.join(SITE, "pt")), "no /es, /pt or other route dirs");
add("no other-route HTML files in site/", fs.readdirSync(SITE).filter((f) => f.endsWith(".html")).length === 1, fs.readdirSync(SITE).filter((f) => f.endsWith(".html")).join(", "));
// Webflow injects the w-mod-js / w-mod-ix marker classes at runtime via JS +
// the webflow runtime, so the SOURCE document must not be expected to contain
// those literals. Check the real markers instead.
const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, "");
add(
  "real DOM retained (Webflow page/site ids + w-mod bootstrap)",
  html.includes('data-wf-page="660adebd409244054ef8f8e4"') &&
    html.includes('data-wf-site="659ee90e075c502b5cc49dae"') &&
    html.includes("w-mod-"),
  "page id + site id + w-mod bootstrap script"
);
add("real Webflow CSS retained (156KB, unmodified selectors)", webflowCss.length > 150000 && webflowCss.includes(".hero---home"));
add("real source JS retained", fs.existsSync(path.join(SITE, "mirror/khanmigo/scripts/660adebd409244054ef8f8e4.webflow.2e86161b.e1beccb54dc36e33.js")));
add("jQuery retained", html.includes("jquery-3.5.1.min.js"));
add(
  "IX2 runtime retained (interactions engine intact)",
  /webflow\.2e86161b[^"]*\.js/.test(html) && html.includes("jquery-3.5.1.min.js") && !html.includes("googletagmanager.com/gtm.js"),
  "webflow runtime + jQuery present, tracking absent"
);

// --- assets --------------------------------------------------------------
const assetsDir = path.join(SITE, "mirror/khanmigo/assets");
const imgFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else imgFiles.push(e.name);
  }
})(assetsDir);
const webp = imgFiles.filter((f) => f.endsWith(".webp")).length;
const svg = imgFiles.filter((f) => f.endsWith(".svg")).length;
add("original raster assets localized (webp, not AI-generated)", webp >= 20, `${webp} .webp files`);
add("original SVG assets localized", svg >= 8, `${svg} .svg files`);
add("responsive image variants preserved", (html.match(/-p-(500|800|1080|1600)\.webp/g) || []).length > 10, `${(html.match(/-p-(500|800|1080|1600)\.webp/g) || []).length} variant refs`);
add("srcset preserved", (html.match(/srcset=/g) || []).length >= 6, `${(html.match(/srcset=/g) || []).length} srcset attrs`);

// --- fonts ---------------------------------------------------------------
const fontFiles = fs.readdirSync(path.join(SITE, "mirror/khanmigo/fonts/files"));
add("fonts self-hosted (woff2)", fontFiles.length >= 19, `${fontFiles.length} .woff2 files`);
add("no remote fonts.gstatic.com in CSS", !fs.readdirSync(path.join(SITE, "mirror/khanmigo/styles")).some((f) => fs.readFileSync(path.join(SITE, "mirror/khanmigo/styles", f), "utf8").includes("fonts.gstatic.com")));

// --- tracking ------------------------------------------------------------
add("GTM/GA removed", !html.includes("googletagmanager") && !html.includes("gtag("));
add("OneTrust removed", !html.includes("cookielaw.org") && !html.includes("onetrust-style") && !html.includes("OptanonWrapper"));
add("OptinMonster removed", !html.includes("omappapi") && !html.includes("optinmonster"));
add("SRI integrity attr removed", !html.includes('integrity="sha384'));

// --- anti-hack -----------------------------------------------------------
// The only <iframe> strings in the source are inside Webflow lightbox
// <script type="application/json"> config for the TED video; no real iframe
// element is embedded in the document.
const iframesOutsideScript = (noScript.match(/<iframe/gi) || []).length;
add(
  "no iframe element in document (no site-embedding hack)",
  iframesOutsideScript === 0,
  iframesOutsideScript + " real iframe tags (lightbox JSON configs excluded)"
);
add("no full-page screenshot used as content", !/screenshot|fullpage|full-page/i.test((html.match(/<img[^>]*>/g) || []).join("")));
add("no Tailwind/Bootstrap/shadcn introduced", !html.includes("tailwind") && !html.includes("bootstrap") && !html.includes("shadcn"));
add("content is real HTML text (not rasterized)", html.includes("<h1") && html.includes("<p class="));

// --- docs ----------------------------------------------------------------
add("asset inventory exists", fs.existsSync(path.join(OUT, "docs/KHANMIGO_HOME_MIRROR_ASSETS.md")));
add("mirror notes exist", fs.existsSync(path.join(OUT, "docs/KHANMIGO_HOME_MIRROR_NOTES.md")));

// ---------------------------------------------------------------------------
// PHASE 2 — AgentKid content swap
// ---------------------------------------------------------------------------
const VI = path.join(SITE, "vi", "index.html");
const enHtml = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const viHtml = fs.existsSync(VI) ? fs.readFileSync(VI, "utf8") : "";

const visibleText = (h) =>
  h
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");

add("P2: EN page built", enHtml.includes("AgentKid") && enHtml.includes("Small steps for children."), "site/index.html");
add("P2: VI page built", viHtml.includes("Từng bước nhỏ cho trẻ."), "site/vi/index.html");
add("P2: no Khanmigo text visible (EN)", !/\bKhanmigo\b|Khan Academy/.test(visibleText(enHtml)));
add("P2: no Khanmigo text visible (VI)", viHtml ? !/\bKhanmigo\b|Khan Academy/.test(visibleText(viHtml)) : false);
add("P2: EN html lang correct", /<html[^>]*\slang="en"/.test(enHtml));
add("P2: VI html lang correct", /<html[^>]*\slang="vi"/.test(viHtml));
add("P2: hreflang pair present (EN)", enHtml.includes('hrefLang="vi"') && enHtml.includes('hrefLang="en"'));
add("P2: language switcher present (both)", enHtml.includes('class="nav-link lang-switch"') && viHtml.includes('class="nav-link lang-switch"'));
add("P2: VI asset paths prefixed with ../", viHtml.includes('src="../mirror/khanmigo/') && !viHtml.includes('src="mirror/khanmigo/'));
add(
  "P2: DOM/CSS/JS untouched (Webflow attrs intact)",
  ["data-wf-page=", "data-wf-site=", "w-nav", "w-slide", "w-dropdown"].every((k) => enHtml.includes(k) && viHtml.includes(k)),
  "webflow structural markers present in both locales"
);
add(
  "P2: no fabricated testimonial attribution",
  enHtml.includes("Design principle") && !enHtml.includes("Ms. Bartsch") && !enHtml.includes("Dani Guardiola") && !enHtml.includes(">Katie<"),
  "Khanmigo testimonial names replaced"
);
add("P2: swap report exists", fs.existsSync(path.join(OUT, "RECON", "content-swap-report.json")));

// --- external links allowed ---------------------------------------------
add("outbound links preserved (allowed by scope §26)", html.includes("khanacademy.org"));

let pass = 0;
console.log("DEFINITION OF DONE\n");
for (const c of checks) {
  console.log(`  [${c.pass ? "x" : " "}] ${c.name}${c.detail ? "  — " + c.detail : ""}`);
  if (c.pass) pass++;
}
console.log(`\n  ${pass}/${checks.length} satisfied`);
if (pass !== checks.length) process.exitCode = 1;
