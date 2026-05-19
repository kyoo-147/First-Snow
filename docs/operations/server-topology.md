# Server Topology

## Primary Server
- Host: `34.55.68.105`
- SSH user: `navin`
- OS: `Ubuntu 22.04`
- Marketing URL: `http://agentkid.io.vn`
- App URL: `http://app.agentkid.io.vn`
- Reverse proxy: `Caddy`

## Runtime Topology
- `Caddy` handles public HTTP/HTTPS ingress and TLS termination for both public hostnames.
- `agentkid-web` runs behind `Caddy` on an internal Docker network.
- A future `agentkid-worker` can join the same Compose project without changing the public entrypoint.
- Current live operating mode is HTTP-only until public `443` is reachable and TLS is re-enabled end-to-end.

## Request Paths
1. Marketing visitors open `http://agentkid.io.vn`.
2. Parent workspace users open `http://app.agentkid.io.vn`.
3. DNS resolves both hostnames to `34.55.68.105`.
4. `Caddy` proxies both hosts to the same `agentkid-web` container.
5. The Next.js app enforces route ownership:
   - landing, detail pages, and `/login` stay on `agentkid.io.vn`
   - `/dashboard` and its child routes stay on `app.agentkid.io.vn`
6. `app.agentkid.io.vn/` redirects to `/dashboard` on the same host.

## Server Layout
- App directory: `/opt/agentkid`
- Compose project: `agentkid-prod`
- Compose file: `/opt/agentkid/compose.yaml`
- Reverse proxy config: `/opt/agentkid/Caddyfile`
- App environment file: `/opt/agentkid/web.env`
- Rollback state record: `/opt/agentkid/.state/last-known-good.json`

## Source of Truth
- This document is the canonical source for the primary server topology and expected server-side asset locations.
- The local deploy config should mirror these coordinates for scripts and automation, without redefining the workflow rules from [deployment-workflow.md](/D:/working/agentkid/docs/operations/deployment-workflow.md).

## Operating Notes
- Initial deployment mode is a minimal `Caddy + web` stack.
- Topology and path changes should be treated as high-risk operational changes.
- Health verification must include both container state and both public hostnames.
- Keep separate `Caddy` site blocks for `agentkid.io.vn` and `app.agentkid.io.vn`.
- If public behavior does not match a changed `Caddyfile`, restart `agentkid-caddy` and verify again.
