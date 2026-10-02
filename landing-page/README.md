# AgentKid Landing Page

Production bilingual static marketing website for AgentKid.

- English: <https://agentkid.io.vn/>
- Vietnamese: <https://agentkid.io.vn/vi/>
- Product application: <https://app.agentkid.io.vn/>
- Parent portal: <https://app.agentkid.io.vn/parent>

## Run locally

Requires Node.js 20 or newer. No package installation is required.

```bash
node scripts/server.mjs 8124
```

Open <http://127.0.0.1:8124> or <http://127.0.0.1:8124/vi/>.

## Important paths

- `site/` — checked-in production artifact
- `site/index.html` — English page
- `site/vi/index.html` — Vietnamese page
- `content/agentkid-content.mjs` — bilingual content source
- `scripts/swap-content.mjs` — deterministic content, favicon, artwork, and CTA transformation
- `scripts/check.mjs` — static artifact validation
- `assets/received/` — AgentKid source artwork
- `site/mirror/khanmigo/assets/agentkid/` — production AgentKid artwork
- `site/mirror/khanmigo/assets/brand/agentkid-favicon.png` — browser icon
- `RECON/` — reconstruction and verification evidence

## Update content

Edit `content/agentkid-content.mjs`, then run:

```bash
node scripts/swap-content.mjs
node scripts/check.mjs
```

Run the local server and review both languages at desktop and mobile widths. Check navigation, CTAs, assets, browser console output, and external links.

The checked-in `site/` directory is the production-ready artifact. A full mirror rebuild fetches the upstream reference website and should only be run intentionally. Routine content changes should use `swap-content.mjs` rather than direct edits to generated HTML.

## Production deployment

The VPS serves this static site from `/var/www/agentkid/current` through Nginx with HTTPS managed by Let's Encrypt. The AgentKid product application is deployed separately at `app.agentkid.io.vn` from the repository's `main` branch.

Never commit VPS passwords, SSH keys, TLS certificates, analytics secrets, private user data, or environment-specific acceptance records.

## Product claims

AgentKid is a support and learning product. Marketing content must not present it as a diagnostic system, therapist, medical device, or replacement for parents, caregivers, teachers, or qualified professionals. Clearly separate current product behavior from research and roadmap work.

## Third-party assets

The mirror retains third-party reference assets and implementation dependencies. Their original ownership and licenses remain applicable. Review provenance before reuse, redistribution, or commercial publication.
