<div align="center">

<img src="assets/agentkid-logo.png" alt="AgentKid" width="520">

[![Website](https://img.shields.io/badge/Website-agentkid.io.vn-16a34a?style=flat-square)](https://agentkid.io.vn/)
[![Vietnamese](https://img.shields.io/badge/Tiếng%20Việt-agentkid.io.vn%2Fvi-2563eb?style=flat-square)](https://agentkid.io.vn/vi/)
[![Product](https://img.shields.io/badge/Product-app.agentkid.io.vn-475569?style=flat-square)](https://app.agentkid.io.vn/)
[![Type](https://img.shields.io/badge/Type-Static%20bilingual%20site-f59e0b?style=flat-square)](#project-status)

<p><strong>The AgentKid production marketing website</strong></p>

A bilingual website introducing AgentKid, its child experience, parent oversight, safety principles, and product direction.

[Live website](https://agentkid.io.vn/) · [Vietnamese](https://agentkid.io.vn/vi/) · [Run locally](#quick-start) · [Content workflow](#content-workflow) · [Branch map](#repository-branches)

</div>

This branch contains the production landing page served at `agentkid.io.vn`. The deployable website is located in [`landing-page/`](landing-page/); it is intentionally separate from the Next.js product application on `main`.

> **Project status:** the English and Vietnamese static pages are deployed in production. The checked-in `landing-page/site/` directory is the deployable artifact. Content and AgentKid artwork have been localized, while retained mirror assets remain implementation dependencies and should be reviewed before broader redistribution.

## Live environments

| Surface | URL | Branch |
| --- | --- | --- |
| English landing page | <https://agentkid.io.vn/> | `landing-page` |
| Vietnamese landing page | <https://agentkid.io.vn/vi/> | `landing-page` |
| AgentKid application | <https://app.agentkid.io.vn/> | `main` |
| Parent portal | <https://app.agentkid.io.vn/parent> | `main` |

## What this website communicates

- AgentKid as a calm learning companion with parent oversight;
- child-facing conversations, lessons, routines, and emotion check-ins;
- parent visibility, privacy controls, and safety boundaries;
- the distinction between current product behavior and research direction;
- clear paths from the marketing website to the product application.

AgentKid is presented as a support tool, not a diagnostic system, therapist, medical device, or replacement for qualified professionals and caregivers.

## Quick start

### Requirements

- Node.js 20 or newer.
- No package installation is required for the local static server.

### Clone this branch

```bash
git clone --branch landing-page https://github.com/kyoo-147/agentkid_snow.git
cd agentkid_snow/landing-page
node scripts/server.mjs 8124
```

Open:

```text
http://127.0.0.1:8124
http://127.0.0.1:8124/vi/
```

## Directory structure

```text
landing-page/
├── assets/received/            AgentKid source artwork
├── content/
│   └── agentkid-content.mjs    English and Vietnamese content source
├── docs/                       Mirror and content-swap documentation
├── RECON/                      Reconstruction and verification evidence
├── scripts/
│   ├── server.mjs              Local static server
│   ├── swap-content.mjs        Deterministic content and CTA transformation
│   ├── check.mjs               Static artifact checks
│   └── ...                     Reconstruction and comparison tooling
└── site/
    ├── index.html              English production page
    ├── vi/index.html           Vietnamese production page
    └── mirror/                 Styles, scripts, fonts, and website assets
```

## Content workflow

Routine copy and CTA updates should start in:

```text
landing-page/content/agentkid-content.mjs
```

Then regenerate and verify:

```bash
cd landing-page
node scripts/swap-content.mjs
node scripts/check.mjs
```

Do not hand-edit generated production HTML unless the content pipeline cannot express the required change and the exception is documented. A complete mirror rebuild fetches the reference website and should only be run intentionally.

## Production deployment

The current VPS serves the static site through Nginx:

```text
Internet
  ├── https://agentkid.io.vn
  └── https://www.agentkid.io.vn
        └── Nginx + Let's Encrypt
              └── /var/www/agentkid/current
```

HTTP redirects to HTTPS, and certificates are renewed through Certbot. Deployment credentials, SSH keys, certificates, and server-specific files must remain outside Git.

## Verification

Before publishing a landing-page change:

```bash
cd landing-page
node scripts/check.mjs
node scripts/server.mjs 8124
```

Review both `/` and `/vi/` at desktop and mobile widths. Verify navigation, product CTAs, local assets, favicon, console output, and all external links.

The original `landing-page` release was verified for reproducible build output, resource links, secret scanning, and matching local/remote Git state. Re-run relevant checks for every later revision; historical verification does not automatically cover new changes.

## Repository branches

| Branch | Purpose |
| --- | --- |
| `main` | Current Snow product UI deployed to `app.agentkid.io.vn` |
| `landing-page` | This bilingual static marketing website |
| `legacy-before-snow-ui` | Preserved earlier AgentKid monorepo and architecture foundation |

The product application must be developed from `main`; this branch is canonical only for the marketing website under `landing-page/`.

## Safety, privacy, and content rules

- Do not claim that AgentKid diagnoses, treats, or understands a child perfectly.
- Distinguish shipped functionality from roadmap or research work.
- Do not publish child-sensitive information in marketing forms or assets.
- Do not commit credentials, private deployment evidence, analytics secrets, or certificates.
- Keep parent responsibility and human supervision explicit.

## License and third-party assets

No repository-wide license is currently declared. All rights are reserved unless a file or bundled dependency states otherwise. The mirrored website contains third-party reference assets and implementation dependencies; their original ownership and licenses remain applicable. Review provenance before reuse, redistribution, or commercial publication.
