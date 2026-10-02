# Khanmigo Home Mirror — Capture Notes

## Source

| | |
|---|---|
| Source URL | `https://www.khanmigo.ai/` |
| Scope | **Homepage route only.** No other route was cloned. |
| Capture date | 2026-09-24 |
| Capture method | Real headless Chromium (Playwright), full-page scroll, live Network inspection |
| Local web root | `site/` |
| Local URL | `http://127.0.0.1:8124/` |

Sub-pages (`khanacademy.org`, `districts.khanacademy.org`, `blog.khanacademy.org`,
`support.khanacademy.org`, and khanmigo.ai's own `/teachers`, `/learners`, `/parents`,
`/writingcoach`, `/es`, `/pt`) were **not** cloned. Links to them remain links.

## Detected frontend / site runtime

| Signal | Value |
|---|---|
| Generator | **Webflow** (`<meta name="generator" content="Webflow">`) |
| HTML marker classes | `w-mod-js w-mod-ix` |
| Site id | `659ee90e075c502b5cc49dae` |
| Page id | `660adebd409244054ef8f8e4` |
| Runtime global | `window.Webflow` present, `Webflow.require("ix2")` resolves |
| JS libraries | jQuery 3.5.1, Webflow IX2 runtime, Typer.js 0.1.0, Google WebFont Loader 1.6.26 |
| Rendering model | Fully server-rendered static HTML — the deployed assets *are* the source |

Because Webflow ships complete server-rendered HTML, the mirror serves the **real source
document** and the **real deployed CSS/JS**. Nothing was re-created, re-styled, or
translated into another framework. Phase 1 priority was fidelity, not code cleanliness.

## Resources captured

| Kind | Count | Notes |
|---|---|---|
| Stylesheets | 5 | 1 Webflow stylesheet + 4 Google Fonts CSS (3 `<link>`, 1 WebFont-loader) |
| Scripts | 9 | of which **5 localized**, 4 were tracking and are stripped |
| Image assets (unique files) | **39** | 27 `.webp`, 9 `.svg`, 3 `.png` |
| — responsive variants | 6 `<img>` with `srcset` (up to 5 widths each) | all variants localized |
| `<img>` elements in DOM | 32 | 12 are the same FAQ caret icon |
| `<picture>` elements | 0 | site uses `srcset` on plain `<img>` |
| Font families | 6 | Lato, Source Serif Pro, Montserrat, Poppins, Source Sans 3, webflow-icons |
| Font files localized | 65 | `.woff2` (all `unicode-range` subsets referenced by the delivered CSS) |
| Font-face rules delivered | 91 (browser-loaded) + 1 base64 `webflow-icons` | |
| Video / `<video>` elements | 0 | |
| Video **embeds** | 1 | Sal Khan TED Talk via Webflow lightbox → YouTube |
| `<iframe>` (live) | 1 | OneTrust `onetrust-text-resize` helper (hidden), stripped |
| Inline `<style>` bytes | 98,686 | of which 98,581 was the OneTrust banner stylesheet (stripped) |
| Network responses observed | 81 | |
| Blocked / stripped requests | 34 | |

### Network hosts observed on the live page

| Host | Requests | Disposition |
|---|---|---|
| `cdn.prod.website-files.com` | 18 | **mirrored** (CSS, JS, images) |
| `fonts.gstatic.com` | 22 | **mirrored** (self-hosted) |
| `fonts.googleapis.com` | 3 | **mirrored** (CSS localized) |
| `www.khanmigo.ai` | 1 | document → `index.html` |
| `d3e54v103j8qbb.cloudfront.net` | 1 | **mirrored** (jQuery) |
| `ajax.googleapis.com` | 1 | **mirrored** (webfont.js) |
| `unpkg.com` | 1 | **mirrored** (typer.js) |
| `a.omappapi.com` | 20 | **stripped** — OptinMonster marketing |
| `cdn.cookielaw.org` | 10 | **stripped** — OneTrust consent |
| `api.omappapi.com` | 2 | **stripped** |
| `www.googletagmanager.com` | 1 | **stripped** — GTM/GA |
| `geolocation.onetrust.com` | 1 | **stripped** |

## Locally repaired behaviour

Only one thing had to change for the page to work locally, plus path rewrites:

1. **WebFont loader pointed at local fonts.** The source calls
   `WebFont.load({ google: { families: [...] } })`, which fetches from Google at runtime.
   It is now `WebFont.load({ custom: { families: [...], urls: [<local font CSS>] } })`.
   The mirrored `webfont.js` is still used, so the `wf-*-active` / `wf-active` classes are
   still applied to `<html>` exactly as on the source.
2. **SRI removed.** The Webflow stylesheet `<link>` carried
   `integrity="sha384-…" crossorigin="anonymous"`. SRI cannot validate a modified local
   file, so the attribute was dropped — otherwise the browser refuses the stylesheet.
3. **URL rewriting.** 61 references localized to `mirror/khanmigo/…`; 6 `url()` refs inside
   the Webflow CSS and 90 inside the Google Fonts CSS rewritten to local files.
4. **Stripped vendors** (tracking/consent only): Google Tag Manager/GA4, OneTrust cookie
   banner (+ its 98 KB inline stylesheet and hidden resize iframe), OptinMonster, OneTrust
   geolocation.
5. **Out-of-scope internal links** (`/teachers`, `/learners`, `/parents`, `/writingcoach`,
   `/`): 7 links pointed at the live `https://www.khanmigo.ai/…` so the nav still leads
   somewhere real instead of 404-ing locally. Their destinations are not cloned.

**Nothing visual was repaired, approximated, or substituted.** No layout, colour, spacing,
typography, or imagery was touched.

## Inaccessible / private functionality excluded

- No authenticated surface was accessed. The mirror is the **public, unauthenticated**
  homepage only.
- `/teachers`, `/learners`, `/parents`, `/writingcoach`, `/es`, `/pt` were not fetched.
- Sign-up / checkout flows (`khanacademy.org/khanmigo/checkout`) were not touched.
- No student, teacher, or district data was requested.
- The TED Talk video itself is not mirrored — the lightbox still points at YouTube.

## Known differences from source

| Difference | Reason | Impact |
|---|---|---|
| Cookie consent banner absent | OneTrust stripped | None on page content. The live original's banner also **blocks clicks** on its own page until dismissed. |
| GTM / GA / OptinMonster absent | Tracking stripped | None visual. |
| `cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg` not localized | Returns **HTTP 403 on the live site itself** | None — the "Katie" testimonial avatar is already a broken image on the source, and is reproduced as-is. |
| TED video opens YouTube | External embed, out of scope | Requires network. Same behaviour as source. |
| Fonts self-hosted from 65 `.woff2` files | Offline robustness | The browser still fetches only the `unicode-range` subsets it needs, exactly as with Google's CDN. |
| Hero headline word depends on animation phase | Typer.js cycles words | Not a difference in behaviour — both sides cycle identically. |

## Verification

All 11 target viewports (375×812 → 1920×1080) compared against the live source:

- **Pixel score: 100.000% at every viewport — 0 differing pixels.**
- `document.scrollHeight` identical at every viewport (5111 / 5128 / 5194 / 5193 / 5844 / 6043).
- All 9 top-level sections identical in `top` and `height` (delta 0).
- All 40 headings identical in font-size, line-height, family, colour and position.
- All 30 rendered images identical in natural width/height and broken-ness (3/3 broken on both — inherited from source).
- **0 console errors** and **0 4xx/5xx responses** on the clone at every viewport.
- Interactions verified 1:1 against source: FAQ accordion (6 items, opens `0 → 404px`), testimonial slider (advances `0 → 1`, `translateX(0) → -560px`), Typer.js word cycling, mobile nav overlay, Webflow IX2 runtime.

Note: to get a deterministic pixel comparison, the Typer.js headline node was replaced with
an identical static `<span>` on **both** sides before screenshotting — otherwise the
comparison measures animation phase rather than layout.

## How to run

```bash
cd web-new
node scripts/server.mjs 8124
# open http://127.0.0.1:8124/
```

Rebuild from the live site at any time:

```bash
node scripts/mirror.mjs      # re-capture + localize (wipes and regenerates site/)
```

## Rebuild / re-verify scripts

| Script | Purpose |
|---|---|
| `scripts/recon.mjs` | Live recon: network, DOM, signals, screenshots |
| `scripts/mirror.mjs` | Capture + localize the homepage (idempotent, wipes `site/`) |
| `scripts/check.mjs` | Assert every local reference resolves on disk |
| `scripts/compare.mjs` | 11-viewport screenshot + pixel diff vs live source |
| `scripts/interact.mjs` | Behavioural parity test (FAQ, slider, typer, nav, IX2) |
| `scripts/server.mjs` | Static server for `site/` |
| `scripts/report.mjs`, `scripts/sectiondiff.mjs`, `scripts/stats.mjs` | Reporting |
| `scripts/gendocs.mjs` | Regenerates the asset inventory |
