# Deployment Workflow

## Purpose
- This document is the canonical workflow for building, publishing, deploying, verifying, and rolling back AgentKid Docker releases.
- Specific host, domain, path, and project values must come from [server-topology.md](/D:/working/agentkid/docs/operations/server-topology.md) and the local deploy config once that file exists.
- Practical lessons and known pitfalls from live rollout are recorded in [deployment-lessons-learned.md](/D:/working/agentkid/docs/operations/deployment-lessons-learned.md).

## Prerequisites
- Local machine has Docker, PowerShell, SSH access, and Docker Hub authentication ready.
- The operator has access to the repo-local deploy config and any required ignored secrets files.
- The target server already has Docker Engine, the Docker Compose plugin, and the expected stack assets in place.
- Expected server-side assets are the Compose file, reverse proxy config, and app environment file described in [server-topology.md](/D:/working/agentkid/docs/operations/server-topology.md).
- When invoking repo deploy scripts on Windows, prefer `powershell -NoProfile -ExecutionPolicy Bypass -File ...`.

## Standard Flow
1. Run local verification relevant to the change.
2. Build the application image with an immutable tag.
3. Push the image to the configured Docker Hub registry.
4. Connect to the primary server defined by the local deploy config.
5. Pull the exact image tag on the server.
6. Update the Docker Compose stack in the configured app directory.
7. Run smoke checks against the required internal paths and the configured public host checks.
8. If checks pass, update the last known good tag record.
9. If checks fail, inspect logs and roll back to the recorded last known good tag.

## Tag Policy
- Use immutable `git-<shortsha>` tags as the default release identity.
- Do not use `latest` as the source of truth for deploy, audit, or rollback.
- Keep rollback references tied to a known good immutable tag.

## Last Known Good Tag
- Record the canonical last known good tag on the server in `/opt/agentkid/.state/last-known-good.json`.
- Update that server-side state only after the deploy finishes and the smoke check contract passes.
- A local file such as `infra/deploy/.state/last-known-good.json` may be kept as a convenience cache, but it must not override the server record.
- Use the server record as the default rollback target unless the operator explicitly chooses another immutable tag.

## Smoke Check Contract
- Internal paths: `/` and `/dashboard`
- Public host checks:
  - marketing home on `agentkid.io.vn`
  - marketing login on `agentkid.io.vn/login`
  - app root redirect on `app.agentkid.io.vn/`
  - app dashboard on `app.agentkid.io.vn/dashboard`
- Acceptable HTTP status codes: `200`, `301`, `302`, `307`, or `308`
- Minimum container checks: the app container is running, and the reverse proxy container is running when it is deployed as a separate container
- Minimum log check: no obvious crash-loop or immediate startup failure in the current release logs
- If the symptom is a blank page or wrong UI, verify response HTML content and not just HTTP status codes.

## Guardrails
- Never treat an ad-hoc SSH session as the normal deployment path when the repo workflow covers the task.
- Never deploy from an unknown tree state without calling that out explicitly.
- Always verify the target image tag, configured Compose project, and configured public host checks before closing the rollout.
- Always run post-deploy smoke checks.
- Roll back before attempting server-side hotfixes on a broken release.

## Confirmation Points
- Pause for user confirmation before first server bootstrap.
- Pause for user confirmation before reverse proxy, domain, or topology changes.
- Pause for user confirmation before any rollout that is expected to cause visible downtime.
