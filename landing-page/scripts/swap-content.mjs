import fs from "node:fs";
import path from "node:path";
import {
  ops,
  faqAnswers,
  FAQ_SPACER_PATTERN,
  ACCORDION_ITEM_PATTERN,
  ACCORDION_ITEM_ORDER,
  linkNeutralise,
  BRAND,
} from "../content/agentkid-content.mjs";

// ---------------------------------------------------------------------------
// Phase 2 — swap all homepage copy to AgentKid, producing two real pages:
//   site/index.html     -> English  (default locale)
//   site/vi/index.html  -> Vietnamese
//
// Input is the PRISTINE localized mirror (RECON/localized-pristine.html), never
// the already-swapped output, so the build is reproducible and idempotent.
//
// DOM structure, Webflow classes, data-w-* attributes, CSS and JS are untouched
// — only text nodes, hrefs and <html lang> change.
// ---------------------------------------------------------------------------

const OUT = path.resolve(import.meta.dirname, "..");
const PRISTINE = path.join(OUT, "RECON", "localized-pristine.html");
const SITE = path.join(OUT, "site");

if (!fs.existsSync(PRISTINE)) {
  console.error(`Missing ${PRISTINE}\nRun: node scripts/mirror.mjs`);
  process.exit(1);
}

const pristine = fs.readFileSync(PRISTINE, "utf8");
const errors = [];
const applied = [];

// ---------------------------------------------------------------------------
function applyOps(html, locale) {
  for (const op of ops) {
    const replacement = op[locale];
    if (replacement === undefined) {
      errors.push(`${op.id}: no "${locale}" value`);
      continue;
    }
    const expected = op.expect ?? 1;
    const count = html.split(op.find).length - 1;
    if (count !== expected) {
      errors.push(`${op.id} [${locale}]: expected ${expected} occurrence(s) of ${JSON.stringify(op.find.slice(0, 70))}, found ${count}`);
      continue;
    }
    html = html.split(op.find).join(replacement);
    applied.push({ id: op.id, area: op.area, locale, count });
  }
  return html;
}

function applyFaq(html, locale) {
  let i = 0;
  const found = (html.match(FAQ_SPACER_PATTERN) || []).length;
  if (found !== faqAnswers.length) {
    errors.push(`FAQ: expected ${faqAnswers.length} answer containers, found ${found}`);
    return html;
  }
  html = html.replace(FAQ_SPACER_PATTERN, (m, open, _inner, close) => {
    const answer = faqAnswers[i++];
    return open + answer[locale] + close;
  });
  applied.push({ id: "faq.answers", area: "faq", locale, count: i });
  return html;
}

// Second (duplicate) FAQ branch: .accordionitem / div.p1-body-2
function applyFaqDuplicate(html, locale) {
  const found = (html.match(ACCORDION_ITEM_PATTERN) || []).length;
  if (found !== ACCORDION_ITEM_ORDER.length) {
    errors.push(`FAQ duplicate: expected ${ACCORDION_ITEM_ORDER.length} .accordionitem blocks, found ${found}`);
    return html;
  }
  let i = 0;
  html = html.replace(ACCORDION_ITEM_PATTERN, (m, open) => {
    const answer = faqAnswers[ACCORDION_ITEM_ORDER[i++]];
    return open + `<div class="p1-body-2">${answer[locale]}</div>`;
  });
  applied.push({ id: "faq.answers.duplicate", area: "faq", locale, count: i });
  return html;
}

function neutraliseLinks(html) {
  let n = 0;
  for (const url of linkNeutralise) {
    const needle = `href="${url}"`;
    const c = html.split(needle).length - 1;
    if (c) {
      html = html.split(needle).join('href="#"');
      n += c;
    }
  }
  applied.push({ id: "links.neutralise", area: "links", locale: "both", count: n });
  return html;
}

// A locale living in a subdirectory (/vi/) resolves relative asset paths from
// its own folder, so every root-relative asset reference needs a ../ prefix.
// CSS files are unaffected: their internal url() refs resolve against the CSS
// file's own location, which does not move.
function prefixLocalAssets(html, locale) {
  if (locale === "en") return html;
  const n = html.split("mirror/khanmigo/").length - 1;
  applied.push({ id: "paths.subdirPrefix", area: "paths", locale, count: n });
  return html.split("mirror/khanmigo/").join("../mirror/khanmigo/");
}

const PRODUCT_URL = "https://app.agentkid.io.vn";

function applyBrandFavicon(html, locale) {
  const patterns = [
    /<link href="mirror\/khanmigo\/assets\/icons\/[^"]*KA_Favicon_32x32\.png" rel="shortcut icon" type="image\/x-icon"\/>/,
    /<link href="mirror\/khanmigo\/assets\/icons\/[^"]*KA_Favicon_72x72\.png" rel="apple-touch-icon"\/>/,
  ];
  const replacements = [
    '<link href="mirror/khanmigo/assets/brand/agentkid-favicon.png" rel="icon" type="image/png"/>',
    '<link href="mirror/khanmigo/assets/brand/agentkid-favicon.png" rel="apple-touch-icon"/>',
  ];
  for (let i = 0; i < patterns.length; i++) {
    if (!patterns[i].test(html)) {
      errors.push(`favicon [${locale}]: expected source icon ${i + 1}`);
      continue;
    }
    html = html.replace(patterns[i], replacements[i]);
  }
  applied.push({ id: "brand.favicon", area: "meta", locale, count: 2 });
  return html;
}

function wireProductLinks(html, locale) {
  const pattern = /<a href="#"([^>]*)>(Explore AgentKid|Khám phá AgentKid)<\/a>/g;
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 6) {
    errors.push(`product links [${locale}]: expected 6 Explore AgentKid links, found ${matches.length}`);
    return html;
  }
  applied.push({ id: "links.product", area: "links", locale, count: matches.length });
  return html.replace(pattern, `<a href="${PRODUCT_URL}"$1>$2</a>`);
}

// Language switcher. Requires a bilingual pair, so it is injected after the
// Language switcher. Requires a bilingual pair, so it is injected after the
// shared text ops using a stable anchor that those ops never touch.
const NAV_ANCHOR = '<nav role="navigation" class="nav-menu-3 w-nav-menu">';
const SWITCHER = {
  en: '<a href="vi/index.html" class="nav-link lang-switch" hreflang="vi" lang="vi">Tiếng Việt</a>',
  vi: '<a href="../index.html" class="nav-link lang-switch" hreflang="en" lang="en">English</a>',
};

function addLanguageSwitcher(html, locale) {
  const count = html.split(NAV_ANCHOR).length - 1;
  if (count !== 1) {
    errors.push(`langswitch [${locale}]: expected 1 nav anchor, found ${count}`);
    return html;
  }
  applied.push({ id: "nav.langswitch", area: "nav", locale, count: 1 });
  return html.replace(NAV_ANCHOR, NAV_ANCHOR + SWITCHER[locale]);
}

function rewriteImageTag(tag, src, alt) {
  return tag
    .replace(/\s+srcset="[^"]*"/, "")
    .replace(/src="[^"]*"/, `src="${src}"`)
    .replace(/alt="[^"]*"/, `alt="${alt}"`);
}

function applyBrandMedia(html, locale) {
  const replaceOne = (id, pattern, replacement) => {
    const matches = html.match(new RegExp(pattern.source, "g")) || [];
    if (matches.length !== 1) {
      errors.push(`${id} [${locale}]: expected one matching image`);
      return;
    }
    html = html.replace(pattern, replacement);
    applied.push({ id, area: "media", locale, count: 1 });
  };

  replaceOne("media.logo", /<img\b[^>]*class="image-86"\/>/, (tag) =>
    rewriteImageTag(tag, "mirror/khanmigo/assets/brand/agentkid-logo.png", "AgentKid"),
  );
  replaceOne("media.hero", /(<div class="hero-image---home">)(<img\b[^>]*\/>)<\/div>/, (_match, open, tag) =>
    `${open}${rewriteImageTag(tag, "mirror/khanmigo/assets/agentkid/hero.png", "AgentKid learning companion")}</div>`,
  );

  const valuePattern = /(<div(?: id="[^"]+")? class="value-prop-typestack-image">)(<img\b[^>]*\/>)<\/div>/g;
  const valueImages = [
    ["children.png", "AgentKid Kid Mode"],
    ["parents.png", "AgentKid parent dashboard"],
    ["safety.png", "AgentKid safety overview"],
  ];
  let valueIndex = 0;
  html = html.replace(valuePattern, (_match, open, tag) => {
    const spec = valueImages[valueIndex++];
    if (!spec) return _match;
    return `${open}${rewriteImageTag(tag, `mirror/khanmigo/assets/agentkid/${spec[0]}`, spec[1])}</div>`;
  });
  if (valueIndex !== valueImages.length) {
    errors.push(`media.valueProps [${locale}]: expected ${valueImages.length} images, found ${valueIndex}`);
  } else {
    applied.push({ id: "media.valueProps", area: "media", locale, count: valueIndex });
  }

  replaceOne("media.footer", /(<div class="footer-hero">)(<img\b[^>]*\/>)<\/div>/, (_match, open, tag) =>
    `${open}${rewriteImageTag(tag, "mirror/khanmigo/assets/agentkid/footer.png", "AgentKid")}</div>`,
  );
  return html;
}

// Keep the product screenshot as a static image. The mirrored source wraps the
// Keep the product screenshot as a static image. The mirrored source wraps the
// image and its overlaid play icon in Webflow lightboxes that open YouTube.
function removeProductVideo(html, locale) {
  const pattern = /<div class="video-module-thumbnail"><a href="#" class="lightbox-link w-inline-block w-lightbox">(<img\b[^>]*class="image-23"\/>)[\s\S]*?<\/script><\/a><a href="#" class="lightbox-link-2 w-inline-block w-lightbox">[\s\S]*?<\/script><\/a><\/div>/;
  const match = html.match(pattern);
  if (!match) {
    errors.push(`product preview [${locale}]: expected YouTube lightbox module`);
    return html;
  }
  const image = match[1]
    .replace(/src="[^"]*"/, 'src="mirror/khanmigo/assets/agentkid/product-surface.png"')
    .replace(/alt="[^"]*"/, 'alt="AgentKid companion with three children"');
  applied.push({ id: "video.staticPreview", area: "ted", locale, count: 1 });
  return html.replace(pattern, `<div class="video-module-thumbnail">${image}</div>`);
}

// ---------------------------------------------------------------------------
// Audit: no Khanmigo/Khan Academy reference may survive as user-visible text,
// ---------------------------------------------------------------------------
// Audit: no Khanmigo/Khan Academy reference may survive as user-visible text,
// as a remote destination, or in page metadata.
//
// Legitimate non-issues that must NOT be flagged:
//   - local asset paths under mirror/khanmigo/ (directory name, not a claim)
//   - data-wf-domain, which Webflow's runtime reads
// ---------------------------------------------------------------------------
function auditLeftovers(html) {
  const issues = [];

  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
  const textHits = new Set();
  for (const m of textOnly.matchAll(/.{0,50}\bKhanmigo\b.{0,50}/gi)) {
    const t = m[0].replace(/\s+/g, " ").trim();
    if (t) textHits.add(t);
  }
  for (const t of textHits) issues.push(`visible text still says Khanmigo: "${t}"`);

  for (const m of html.matchAll(/\b(?:href|src)="([^"]*)"/gi)) {
    const v = m[1];
    if (/^(mirror\/|#|index\.html|\.\.\/|vi\/)/.test(v)) continue;
    if (/khanmigo\.ai|khanacademy\.org|khanmigo\.com/i.test(v)) {
      issues.push(`remote brand link survives: ${v.slice(0, 90)}`);
    }
  }

  for (const m of html.matchAll(/content="([^"]*)"/gi)) {
    const v = m[1];
    if (/^(\.\.\/)?mirror\//.test(v)) continue;
    if (/Khanmigo|Khan Academy/i.test(v)) issues.push(`meta content still references Khanmigo: "${v.slice(0, 90)}"`);
  }

  return [...new Set(issues)];
}

// ---------------------------------------------------------------------------
function build(locale, outFile) {
  let html = pristine;
  html = applyOps(html, locale);
  html = applyFaq(html, locale);
  html = applyFaqDuplicate(html, locale);
  html = applyBrandMedia(html, locale);
  html = removeProductVideo(html, locale);
  html = applyBrandFavicon(html, locale);
  html = addLanguageSwitcher(html, locale);
  html = neutraliseLinks(html);
  html = wireProductLinks(html, locale);
  html = prefixLocalAssets(html, locale);

  const leftovers = auditLeftovers(html);
  if (leftovers.length) {
    errors.push(`${locale}: ${leftovers.length} surviving Khanmigo reference(s):\n      - ` + leftovers.slice(0, 12).join("\n      - "));
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, "utf8");
  return html;
}

const en = build("en", path.join(SITE, "index.html"));
const vi = build("vi", path.join(SITE, "vi", "index.html"));

if (errors.length) {
  console.error("\nBUILD FAILED — replacements did not all apply:\n");
  for (const e of errors) console.error("  ! " + e);
  process.exit(1);
}

console.log(`Applied ${applied.length} operations x2 locales`);
console.log(`  EN -> site/index.html        (${(en.length / 1024).toFixed(1)} KB)`);
console.log(`  VI -> site/vi/index.html     (${(vi.length / 1024).toFixed(1)} KB)`);

const byArea = {};
for (const a of applied) {
  if (a.locale !== "en") continue;
  byArea[a.area] = (byArea[a.area] || 0) + a.count;
}
console.log("\nSlots changed per area (EN):");
for (const [k, v] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(14)} ${v}`);
}

fs.writeFileSync(
  path.join(OUT, "RECON", "content-swap-report.json"),
  JSON.stringify({ brand: BRAND, locales: { en: "site/index.html", vi: "site/vi/index.html" }, applied }, null, 2),
  "utf8"
);
