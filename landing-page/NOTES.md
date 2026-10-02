# web-new — AgentKid website (mirrored from Khanmigo)

Two phases, both complete:

1. **Phase 1 — Mirror.** The public Khanmigo homepage (`https://www.khanmigo.ai/`) was pulled
   from the live site and localized. Real DOM, real deployed Webflow CSS, real runtime JS, real
   image and font assets. Nothing was re-created from screenshots.
   **Result: 100% pixel match at all 11 target viewports, 0 console errors, 0 broken refs.**

2. **Phase 2 — Content swap.** All copy replaced with **AgentKid** product content, sourced from
   `D:\work\agentkid`. DOM / CSS / layout / JS untouched. Now bilingual.

## Location

This project lives inside the AgentKid repo at **`D:\work\agentkid\web-new`** — self-contained in
its own subfolder, so it does not touch the Next.js app (`app/`, `components/`, `messages/`) or the
repo's own root-level `scripts/` and `docs/`.

> ⚠️ **Git note:** the AgentKid repo's `.gitignore` has a bare `docs/` rule, which also excludes
> `web-new/docs/` — i.e. the mirror + Phase 2 documentation would **not** be committed. To track it,
> add to `D:\work\agentkid\.gitignore`:
> ```
> !web-new/docs/
> !web-new/docs/**
> ```
> (Both lines are needed; git will not descend into an excluded directory otherwise.)

Everything is path-relative (`import.meta.dirname`), so the folder can be moved again freely.
The only absolute path is a machine-level Playwright lookup in `scripts/pw.mjs`.

## Run it

```bash
cd D:\work\agentkid\web-new
node scripts/server.mjs 8124
# EN -> http://127.0.0.1:8124/
# VI -> http://127.0.0.1:8124/vi/
```

The web root is `site/`. Serve over HTTP (not `file://`) so fonts and CSS load.

## Layout

```
web-new/
  site/                              <- web root
    index.html                       <- AgentKid, English
    vi/index.html                    <- AgentKid, Tiếng Việt
    mirror/khanmigo/
      assets/{brand,hero,press,teacher,learners,parents,
              testimonials,ted,final-cta,icons,misc}/
      fonts/files/                   <- 65 self-hosted .woff2 (no Google dependency)
      styles/                        <- Webflow stylesheet + localized Google Fonts CSS
      scripts/                       <- Webflow runtime, jQuery, typer.js, webfont.js
  content/
    agentkid-content.mjs             <- SINGLE SOURCE OF TRUTH for all copy (EN + VI)
  RECON/                             <- evidence: recon, manifests, screenshots, reports
  docs/
    KHANMIGO_HOME_MIRROR_ASSETS.md   <- full asset inventory
    KHANMIGO_HOME_MIRROR_NOTES.md    <- capture notes, runtime, known differences
    PHASE2_AGENTKID_CONTENT_SWAP.md  <- what changed + launch blockers  <-- read this
    PHASE2_TEXT_INVENTORY.md         <- every original string, for reference
  scripts/                           <- the tooling that produced and verifies all of the above
```

## Rebuild / verify

```bash
node scripts/build.mjs              # mirror + swap (needs network)
node scripts/build.mjs --skip-mirror  # re-apply content only (fast)
node scripts/check.mjs              # every local reference resolves
node scripts/p2-verify.mjs          # EN + VI render, text, interactions
node scripts/switch-test.mjs        # language switcher round trip
node scripts/overflow-check.mjs     # text overflow / clipping
node scripts/compare.mjs http://127.0.0.1:8124/ all   # 11-viewport pixel diff vs LIVE Khanmigo
node scripts/dod.mjs                # definition-of-done checklist
```

To change copy: edit `content/agentkid-content.mjs`, then `node scripts/swap-content.mjs`.
Every replacement declares the exact number of expected matches, so the build fails loudly
rather than silently no-op'ing. A post-swap audit also blocks any surviving Khanmigo reference
in visible text, remote links, or metadata.

## Scope discipline

- Only Khanmigo's `/` was mirrored. No other route was cloned.
- Deliberately stripped: Google Tag Manager/GA4, OneTrust cookie banner, OptinMonster.
- No authenticated or private surface was accessed.
- AgentKid claims are limited to what the AgentKid repo proves is implemented. Nothing from the
  brief's "do not say" list was written; no testimonial or KPI was invented.

## ⚠️ Not launch-ready yet

Images were intentionally left as Khanmigo's (anh chọn "chỉ đổi text"). **The logo, the press
logos, the product imagery and the TED video are still Khanmigo's** — see the launch-blocker
table in `docs/PHASE2_AGENTKID_CONTENT_SWAP.md`. Most links are also `href="#"` until AgentKid's
real routes exist.
