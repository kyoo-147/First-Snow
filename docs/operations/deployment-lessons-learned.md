# Deployment Lessons Learned

## Purpose
- This document captures practical deployment knowledge from the first live AgentKid rollout.
- Use it together with [deployment-workflow.md](/D:/working/agentkid/docs/operations/deployment-workflow.md) and [server-topology.md](/D:/working/agentkid/docs/operations/server-topology.md) when debugging or repeating a deploy.

## Confirmed Live Shape
- `agentkid.io.vn` owns landing, marketing pages, and `/login`.
- `app.agentkid.io.vn` owns `/dashboard` and every `/dashboard/*` route.
- `Caddy` proxies both hosts to the same `agentkid-web` container.
- The Next.js app, not `Caddy`, decides which host should own each route.

## Critical Runtime Rules
- The Docker image must include `apps/web/middleware.ts`. If middleware is missing from the image, host-aware routing will silently fail in production even when local code looks correct.
- `app.agentkid.io.vn/` should redirect to `/dashboard` on the same host.
- `agentkid.io.vn/dashboard` should redirect to the app host.
- Login should link directly to the app host for dashboard entry instead of relying only on middleware to correct the host later.

## Caddy Lessons
- Keep separate site blocks for `agentkid.io.vn` and `app.agentkid.io.vn`.
- A combined host declaration was observed to produce a misleading blank `200` response on the marketing domain.
- If the mounted `Caddyfile` changes but public behavior does not, explicitly restart the `agentkid-caddy` container and verify the running config again.

## Build And Packaging Lessons
- Build from the repo root with `apps/web/Dockerfile` as the Dockerfile path.
- PowerShell script execution on Windows may be blocked by execution policy. Use `powershell -NoProfile -ExecutionPolicy Bypass -File ...` for the deploy scripts.
- Relative TypeScript imports are safer than repo-specific path aliases in files that must build inside the container unless alias resolution is already proven in that image build path.

## Verification Lessons
- Verify all of these after every rollout:
  - `http://agentkid.io.vn/` returns landing HTML
  - `http://agentkid.io.vn/login` returns login HTML
  - `http://app.agentkid.io.vn/` redirects to `http://app.agentkid.io.vn/dashboard`
  - `http://app.agentkid.io.vn/dashboard` returns dashboard HTML
  - `agentkid-web` is `healthy`
  - `agentkid-caddy` is running
- Public status checks alone are not enough. Also inspect the returned HTML when the symptom is "blank page" or "wrong UI on the right domain."

## Current Infrastructure Caveat
- Public HTTP on port `80` is working.
- Public HTTPS is not ready until external port `443` is reachable and end-to-end TLS is re-enabled and verified.
- Until that is fixed, avoid introducing forced `https://` redirects in host-routing code because they break the live preview path for users.

## Recovery Checklist
1. Re-read `docs/operations/deployment-workflow.md`.
2. Re-read `docs/operations/server-topology.md`.
3. Confirm the local deploy config still targets `34.55.68.105`, `/opt/agentkid`, and `agentkid-prod`.
4. Confirm `web.env` on the server still defines both `NEXT_PUBLIC_MARKETING_URL` and `NEXT_PUBLIC_APP_URL`.
5. Build and push an immutable image tag.
6. Deploy with `infra/deploy/deploy-server.ps1`.
7. Run `infra/deploy/smoke-check.ps1`.
8. If behavior is still wrong, inspect returned HTML, then inspect `docker logs agentkid-web` and `docker logs agentkid-caddy`.

## Last Known Good Reference
- The first verified split-domain release after these lessons was:
  - Image: `macdaiqua147/agentkid-web:manual-20260517093530`
- Treat that tag as a historical recovery point, not as the permanent default for future rollouts.
