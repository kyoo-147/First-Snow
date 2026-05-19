---
name: agentkid-docker-deploy
description: Deploy AgentKid from this repo to the primary Ubuntu server through Docker Hub, Docker Compose, and Caddy. Use when Codex needs to build images, push images, bootstrap or update the server for agentkid.io.vn and app.agentkid.io.vn, run smoke checks, or roll back this repo's deployment workflow.
---

# AgentKid Docker Deploy

## Required Read Order
1. `README.md`
2. `PROJECT_OVERVIEW.md`
3. `ARCHITECTURE.md`
4. `DEPLOYMENT_GUIDE.md`
5. `docs/operations/deployment-workflow.md`
6. `docs/operations/server-topology.md`
7. `docs/operations/deployment-lessons-learned.md`
8. `infra/deploy/deploy.config.local.json`

## Deployment Contract
- Build the web image from the repo root context with `apps/web/Dockerfile`.
- Use immutable tags in the form `git-<shortsha>`.
- Push images to the Docker Hub namespace from `infra/deploy/deploy.config.local.json`.
- Bootstrap assets in `infra/deploy/server/` are copied to `/opt/agentkid/` on the server before runtime.
- The runtime stack expects `/opt/agentkid/compose.yaml`, `/opt/agentkid/Caddyfile`, and `/opt/agentkid/web.env`.
- The runtime serves both `agentkid.io.vn` and `app.agentkid.io.vn` through the same reverse proxy and app container.
- The Docker image must include host-routing middleware or split-domain behavior will break.
- Update the server-side last-known-good record only after smoke checks pass.

## Standard Commands
- Build and push:
  `powershell -NoProfile -ExecutionPolicy Bypass -File infra/deploy/build-and-push.ps1 -ConfigPath infra/deploy/deploy.config.local.json`
- Deploy:
  `powershell -NoProfile -ExecutionPolicy Bypass -File infra/deploy/deploy-server.ps1 -ConfigPath infra/deploy/deploy.config.local.json -ImageTag <tag>`
- Smoke check:
  `powershell -NoProfile -ExecutionPolicy Bypass -File infra/deploy/smoke-check.ps1 -ConfigPath infra/deploy/deploy.config.local.json`
- Rollback:
  `powershell -NoProfile -ExecutionPolicy Bypass -File infra/deploy/rollback.ps1 -ConfigPath infra/deploy/deploy.config.local.json [-ImageTag <tag>]`

## Guardrails
- Do not hardcode secrets into repo-tracked files.
- Do not deploy the mutable `latest` tag.
- Treat first bootstrap, reverse proxy changes, and domain changes as confirmation points.
- Keep `/opt/agentkid/.state/last-known-good.json` as the canonical rollback record.
- Roll back before attempting ad-hoc server hotfixes on a broken release.
- If live behavior looks wrong but status codes pass, inspect returned HTML and then inspect both `agentkid-web` and `agentkid-caddy` logs.
- Avoid forcing HTTPS redirects until public `443` is confirmed reachable.

## Runtime Assumptions
- Local machine has Docker, SSH, SCP, and Docker Hub auth available.
- Server is Ubuntu 22.04 with Docker Engine and Docker Compose plugin installed or ready to install during bootstrap.
- Both `agentkid.io.vn` and `app.agentkid.io.vn` resolve to the primary server before public smoke checks can pass.
- Current known-good public checks are HTTP, not HTTPS.
