# AgentKid Landing Page

Bilingual static marketing website for AgentKid.

- English: `/`
- Vietnamese: `/vi/`
- Production: <https://agentkid.io.vn>
- Product CTA: <https://app.agentkid.io.vn>

## Run locally

Requires Node.js 20 or newer. No package installation is required for the static server.

```bash
cd landing-page
node scripts/server.mjs 8124
```

Open <http://127.0.0.1:8124>.

## Important paths

- `site/` — deployable static website
- `site/index.html` — English page
- `site/vi/index.html` — Vietnamese page
- `content/agentkid-content.mjs` — bilingual content source
- `scripts/swap-content.mjs` — deterministic content, favicon and CTA transformation
- `assets/received/` — AgentKid source artwork
- `site/mirror/khanmigo/assets/agentkid/` — production artwork
- `site/mirror/khanmigo/assets/brand/agentkid-favicon.png` — browser tab icon

## Update content

Edit `content/agentkid-content.mjs`, then run:

```bash
node scripts/swap-content.mjs
node scripts/check.mjs
```

The checked-in `site/` directory is the production-ready artifact. A full mirror rebuild fetches the upstream reference website and should only be run intentionally; routine copy changes should use `swap-content.mjs`.

## Deployment layout

The current VPS serves the static site from `/var/www/agentkid/current` through Nginx. Do not commit VPS passwords, SSH keys, certificates or environment files to this repository.
