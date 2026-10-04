# Production operations

Last verified: 2026-10-03

## Runtime layout

- Public app: `https://app.agentkid.io.vn`
- Landing page: `https://agentkid.io.vn`
- Application releases: `/var/www/agentkid-ui/releases/<timestamp>-<sha>`
- Active release symlink: `/var/www/agentkid-ui/current`
- Environment file: `/etc/agentkid.env` (`root:root`, mode `0600`)
- PostgreSQL database: `agentkid_prod`
- Next.js service: `agentkid.service`, loopback port `3001`
- Companion gateway: `agentkid-gateway.service`, loopback port `4001`
- Privacy/safety jobs: `agentkid-safety-worker.timer`
- Daily local database backup: `agentkid-db-backup.timer`

Do not put environment values, provider credentials, database URLs, or deploy keys in this repository.

## Atomic deployment contract

1. Resolve and record the exact Git commit to deploy.
2. Clone that commit into a new timestamped release directory. Never build in the active release.
3. Run `npm ci --ignore-scripts`.
4. Load `/etc/agentkid.env` only inside the privileged deployment shell.
5. Run `npm run db:migrate` and the idempotent `npm run db:seed`. The standard seed now populates the lesson catalog as well as the admin/parent users, household, and children; `npm run db:seed:lessons` remains available for catalog-only reseeding.
6. Run `npm run build` and `npm run build:gateway`.
7. Copy `public/` and `.next/static/` into the standalone output and record `DEPLOYED_SHA`.
8. Atomically update `/var/www/agentkid-ui/current`.
9. Restart the app, gateway, and worker timer.
10. If app or gateway health fails, restore the previous symlink and restart both services.

The database migration step is forward-only. A code rollback does not reverse schema changes.

## Required post-deploy checks

```bash
systemctl is-active agentkid.service agentkid-gateway.service postgresql.service agentkid-safety-worker.timer nginx
cat /var/www/agentkid-ui/current/.next/standalone/DEPLOYED_SHA
curl -fsS http://127.0.0.1:3001/api/auth/session
curl -fsS http://127.0.0.1:4001/health
nginx -t
```

From a trusted client, run the read-only production browser smoke:

```bash
E2E_BASE_URL=https://app.agentkid.io.vn npx playwright test --project=chromium --grep "public smoke"
```

Never enable `E2E_ALLOW_MUTATIONS=1` against production or shared staging.

Expected unauthenticated behavior:

- `/api/auth/session` returns `{ "session": null }`.
- `/session/home` redirects to `/child-login`.
- Protected APIs return `401`.
- A WebSocket connection with an invalid one-time ticket is rejected with `401`.
- API responses include `Cache-Control: private, no-store, max-age=0`.

## Database backups

`agentkid-db-backup.timer` creates a custom-format `pg_dump` plus SHA-256 checksum under `/var/backups/agentkid-postgres`. Files are root-only and retained locally for 14 days.

Useful checks:

```bash
systemctl list-timers agentkid-db-backup.timer
systemctl status agentkid-db-backup.service
sha256sum -c /var/backups/agentkid-postgres/*.sha256
```

A restore test must use a temporary database and must be dropped afterward. The 2026-10-03 verification restored 24 public tables and the four seeded lessons successfully.

This is a local same-host backup only. Offsite encrypted backup and restore monitoring remain required for disaster recovery.

## Provider state

The text companion supports an optional OpenAI-compatible provider configured by environment variables documented in `.env.example`. Without credentials it returns `PROVIDER_UNAVAILABLE`; this is intentional fail-closed behavior.

ASR, TTS, physical microphone verification, Live2D model rendering, object storage, email delivery, and Web Push remain unavailable until their real services, credentials, and legally usable assets are provisioned and verified. Do not represent those capabilities as active.
