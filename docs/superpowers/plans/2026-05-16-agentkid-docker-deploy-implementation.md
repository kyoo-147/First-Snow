# AgentKid Docker Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repo-local Docker deployment system for AgentKid with canonical operations docs, local ignored deploy config, reusable PowerShell scripts, server bootstrap assets, and a repo-local Codex skill.

**Architecture:** Keep deployment knowledge in the repo as a combination of canonical docs, machine-readable local config, deterministic scripts, and a repo-local skill. Bootstrap the primary Ubuntu 22.04 server with a `Caddy -> app container` Docker Compose stack, and require immutable Docker image tags plus smoke checks for every rollout.

**Tech Stack:** Markdown docs, JSON config, PowerShell scripts, Docker, Docker Compose, Caddy, SSH, Docker Hub

---

### Task 1: Create canonical operations docs

**Files:**
- Create: `docs/operations/deployment-workflow.md`
- Create: `docs/operations/server-topology.md`
- Modify: `docs/operations/README.md`
- Test: `scripts/checks/check-doc-structure.ps1`

- [ ] **Step 1: Write the deployment workflow document**

```md
# Deployment Workflow

## Purpose
This document is the canonical workflow for building, publishing, deploying, verifying, and rolling back AgentKid Docker releases.

## Standard Flow
1. Run local verification relevant to the change.
2. Build the application image with an immutable tag.
3. Push the image to Docker Hub.
4. SSH into the primary server.
5. Pull the exact image tag on the server.
6. Update the Docker Compose stack.
7. Run smoke checks from the server and against the public URL.
8. If checks fail, inspect logs and roll back.

## Guardrails
- Never deploy from an uncommitted or unknown tree state without calling that out.
- Never use `latest` as the source of truth for deploy or rollback.
- Always prefer `git-<shortsha>` tags.
- Always run post-deploy smoke checks.
- Roll back before attempting ad-hoc hotfixes on the server.
```

- [ ] **Step 2: Write the server topology document**

```md
# Server Topology

## Primary Server
- Host: `34.55.68.105`
- SSH user: `navin`
- OS: `Ubuntu 22.04`
- Public URL: `https://app.agentkid.io.vn`

## Runtime Topology
- `Caddy` handles public HTTP/HTTPS ingress and TLS termination.
- `agentkid-web` runs behind `Caddy` on an internal Docker network.
- Future `agentkid-worker` can join the same Compose project without changing the public entrypoint.

## Server Layout
- App directory: `/opt/agentkid`
- Compose project: `agentkid-prod`
- Reverse proxy config: `/opt/agentkid/Caddyfile`
- Compose file: `/opt/agentkid/compose.yaml`
```

- [ ] **Step 3: Update the operations index so the new docs are discoverable**

```md
# Operations Docs

Operational constraints, changelog, privacy, security, and roadmap status references live here.

## Deployment
- [deployment-workflow.md](/D:/working/agentkid/docs/operations/deployment-workflow.md)
- [server-topology.md](/D:/working/agentkid/docs/operations/server-topology.md)
```

- [ ] **Step 4: Run the docs structure check**

Run: `pnpm check:docs`
Expected: exits successfully with no missing canonical doc structure errors

- [ ] **Step 5: Commit**

```bash
git add docs/operations/README.md docs/operations/deployment-workflow.md docs/operations/server-topology.md
git commit -m "docs: add deployment operations canon"
```

### Task 2: Add local deploy config contract and ignore rules

**Files:**
- Create: `infra/deploy/deploy.config.template.json`
- Create: `infra/deploy/.state/.gitkeep`
- Modify: `.gitignore`
- Test: `infra/deploy/deploy.config.template.json`

- [ ] **Step 1: Write the deploy config template**

```json
{
  "project": {
    "name": "agentkid",
    "publicAppUrl": "https://app.agentkid.io.vn"
  },
  "dockerHub": {
    "namespace": "macdaiqua147"
  },
  "images": {
    "web": "macdaiqua147/agentkid-web",
    "worker": "macdaiqua147/agentkid-worker"
  },
  "server": {
    "sshUser": "navin",
    "sshHost": "34.55.68.105",
    "appDir": "/opt/agentkid",
    "composeProjectName": "agentkid-prod",
    "os": "ubuntu-22.04"
  },
  "proxy": {
    "type": "caddy",
    "domain": "app.agentkid.io.vn"
  },
  "healthchecks": {
    "publicUrl": "https://app.agentkid.io.vn",
    "internalPath": "/",
    "expectedStatusCodes": [200, 301, 302]
  },
  "deploy": {
    "defaultTarget": "primary",
    "tagStrategy": "git-sha",
    "rollbackStateFile": "infra/deploy/.state/last-known-good.json"
  }
}
```

- [ ] **Step 2: Extend `.gitignore` for local deploy secrets and state**

```gitignore
# Local deploy config
infra/deploy/deploy.config.local.json
infra/deploy/.state/*.json
!infra/deploy/.state/.gitkeep
```

- [ ] **Step 3: Add the state directory placeholder**

```text
infra/deploy/.state/.gitkeep
```

- [ ] **Step 4: Validate the JSON template parses**

Run: `powershell -NoProfile -Command "Get-Content -Raw infra/deploy/deploy.config.template.json | ConvertFrom-Json | Out-Null"`
Expected: exits successfully with no JSON parse errors

- [ ] **Step 5: Commit**

```bash
git add .gitignore infra/deploy/deploy.config.template.json infra/deploy/.state/.gitkeep
git commit -m "chore: add deploy config contract"
```

### Task 3: Add first-boot server assets

**Files:**
- Create: `infra/deploy/server/compose.yaml`
- Create: `infra/deploy/server/Caddyfile`
- Create: `infra/deploy/server/web.env.template`
- Test: `infra/deploy/server/compose.yaml`

- [ ] **Step 1: Write the Compose stack for Caddy and the app container**

```yaml
services:
  caddy:
    image: caddy:2
    container_name: agentkid-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web

  web:
    image: ${WEB_IMAGE}
    container_name: agentkid-web
    restart: unless-stopped
    env_file:
      - ./web.env
    expose:
      - "3000"

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 2: Write the default Caddyfile**

```caddyfile
app.agentkid.io.vn {
  encode gzip zstd

  reverse_proxy web:3000
}
```

- [ ] **Step 3: Write the server-side environment template**

```env
# Copy this file to web.env on the server and fill in real values.
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://app.agentkid.io.vn
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_APPLICATION_CREDENTIALS_JSON=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_GEMINI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ZALO_OA_ACCESS_TOKEN=
ZALO_OA_ID=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

- [ ] **Step 4: Validate the Compose file**

Run: `docker compose -f infra/deploy/server/compose.yaml config`
Expected: exits successfully and renders the merged Compose config

- [ ] **Step 5: Commit**

```bash
git add infra/deploy/server/compose.yaml infra/deploy/server/Caddyfile infra/deploy/server/web.env.template
git commit -m "infra: add server bootstrap assets"
```

### Task 4: Implement build and smoke-check scripts

**Files:**
- Create: `infra/deploy/build-and-push.ps1`
- Create: `infra/deploy/smoke-check.ps1`
- Test: `infra/deploy/build-and-push.ps1`
- Test: `infra/deploy/smoke-check.ps1`

- [ ] **Step 1: Write the build-and-push script**

```powershell
[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [string]$ImageTag
)

$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\\..")
$gitSha = (git -C $repoRoot rev-parse --short HEAD).Trim()
if (-not $ImageTag) { $ImageTag = "git-$gitSha" }
$webImage = "$($config.images.web):$ImageTag"

docker build -t $webImage -f apps/web/Dockerfile $repoRoot
if ($LASTEXITCODE -ne 0) { throw "Docker build failed for $webImage" }

docker push $webImage
if ($LASTEXITCODE -ne 0) { throw "Docker push failed for $webImage" }

Write-Host "Published $webImage"
```

- [ ] **Step 2: Write the smoke-check script**

```powershell
[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json"
)

$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$publicUrl = $config.healthchecks.publicUrl
$statusCodes = @($config.healthchecks.expectedStatusCodes)

$response = Invoke-WebRequest -Uri $publicUrl -Method Get -MaximumRedirection 0 -SkipHttpErrorCheck
if ($statusCodes -notcontains [int]$response.StatusCode) {
  throw "Unexpected public status code: $($response.StatusCode)"
}

Write-Host "Smoke check passed for $publicUrl with status $($response.StatusCode)"
```

- [ ] **Step 3: Verify the build script parses**

Run: `powershell -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('infra/deploy/build-and-push.ps1',[ref]$null,[ref]$null)"`
Expected: exits successfully with no parse errors

- [ ] **Step 4: Verify the smoke script parses**

Run: `powershell -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('infra/deploy/smoke-check.ps1',[ref]$null,[ref]$null)"`
Expected: exits successfully with no parse errors

- [ ] **Step 5: Commit**

```bash
git add infra/deploy/build-and-push.ps1 infra/deploy/smoke-check.ps1
git commit -m "feat: add image publish and smoke scripts"
```

### Task 5: Implement deploy and rollback scripts

**Files:**
- Create: `infra/deploy/deploy-server.ps1`
- Create: `infra/deploy/rollback.ps1`
- Modify: `infra/deploy/smoke-check.ps1`
- Test: `infra/deploy/deploy-server.ps1`
- Test: `infra/deploy/rollback.ps1`

- [ ] **Step 1: Write the deploy-server script**

```powershell
[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [string]$ImageTag
)

$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$server = "$($config.server.sshUser)@$($config.server.sshHost)"
$remoteDir = $config.server.appDir
$webImage = "$($config.images.web):$ImageTag"

$remoteScript = @"
set -e
mkdir -p $remoteDir
cd $remoteDir
export WEB_IMAGE=$webImage
docker pull $webImage
docker compose -p $($config.server.composeProjectName) -f compose.yaml up -d
"@

ssh $server $remoteScript
if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed on $server" }

powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "smoke-check.ps1") -ConfigPath $ConfigPath
```

- [ ] **Step 2: Extend the smoke check so it can validate a remote container state later**

```powershell
[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [switch]$IncludeRemoteContainerCheck
)

if ($IncludeRemoteContainerCheck) {
  $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
  $server = "$($config.server.sshUser)@$($config.server.sshHost)"
  ssh $server "docker ps --format '{{.Names}}' | grep agentkid-web" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "agentkid-web container is not running on remote host" }
}
```

- [ ] **Step 3: Write the rollback script**

```powershell
[CmdletBinding()]
param(
  [string]$ConfigPath = "infra/deploy/deploy.config.local.json",
  [string]$ImageTag
)

if (-not $ImageTag) { throw "ImageTag is required for rollback" }

powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "deploy-server.ps1") -ConfigPath $ConfigPath -ImageTag $ImageTag
```

- [ ] **Step 4: Verify both scripts parse**

Run: `powershell -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('infra/deploy/deploy-server.ps1',[ref]$null,[ref]$null); [void][System.Management.Automation.Language.Parser]::ParseFile('infra/deploy/rollback.ps1',[ref]$null,[ref]$null)"`
Expected: exits successfully with no parse errors

- [ ] **Step 5: Commit**

```bash
git add infra/deploy/deploy-server.ps1 infra/deploy/rollback.ps1 infra/deploy/smoke-check.ps1
git commit -m "feat: add server deploy and rollback scripts"
```

### Task 6: Create the repo-local deploy skill

**Files:**
- Create: `skills/agentkid-docker-deploy/SKILL.md`
- Test: `skills/agentkid-docker-deploy/SKILL.md`

- [ ] **Step 1: Write the skill frontmatter and trigger description**

```md
---
name: agentkid-docker-deploy
description: Deploy AgentKid to the primary Ubuntu server through Docker Hub, Docker Compose, and Caddy. Use when Codex needs to build images, push images, bootstrap the primary server, deploy to app.agentkid.io.vn, run smoke checks, or roll back this repo's server deployment workflow.
---
```

- [ ] **Step 2: Write the skill body with the required read order and guardrails**

```md
# AgentKid Docker Deploy

## Required Read Order
1. `README.md`
2. `PROJECT_OVERVIEW.md`
3. `ARCHITECTURE.md`
4. `DEPLOYMENT_GUIDE.md`
5. `docs/operations/deployment-workflow.md`
6. `docs/operations/server-topology.md`
7. `infra/deploy/deploy.config.local.json`

## Standard Commands
- Build and push: `powershell -ExecutionPolicy Bypass -File infra/deploy/build-and-push.ps1`
- Deploy: `powershell -ExecutionPolicy Bypass -File infra/deploy/deploy-server.ps1 -ImageTag <tag>`
- Smoke check: `powershell -ExecutionPolicy Bypass -File infra/deploy/smoke-check.ps1`
- Rollback: `powershell -ExecutionPolicy Bypass -File infra/deploy/rollback.ps1 -ImageTag <tag>`

## Guardrails
- Do not hardcode secrets into repo files.
- Do not deploy with mutable tags as the source of truth.
- Treat first bootstrap and reverse proxy changes as confirmation points.
- Roll back before trying ad-hoc hotfixes on the server.
```

- [ ] **Step 3: Validate the skill has the required frontmatter**

Run: `powershell -NoProfile -Command "$content = Get-Content -Raw 'skills/agentkid-docker-deploy/SKILL.md'; if ($content -notmatch '(?s)^---.*name: agentkid-docker-deploy.*description: .*---') { throw 'Missing required skill frontmatter' }"`
Expected: exits successfully with no validation error

- [ ] **Step 4: Commit**

```bash
git add skills/agentkid-docker-deploy/SKILL.md
git commit -m "feat: add repo-local deploy skill"
```

### Task 7: Run repository verification and finalize docs

**Files:**
- Modify: `docs/operations/deployment-workflow.md`
- Modify: `docs/operations/server-topology.md`
- Modify: `docs/superpowers/specs/2026-05-16-agentkid-docker-deploy-design.md`
- Test: `pnpm check:docs`
- Test: `docker compose -f infra/deploy/server/compose.yaml config`

- [ ] **Step 1: Reconcile the implementation details back into the canonical docs**

```md
## Scripts
- `infra/deploy/build-and-push.ps1`
- `infra/deploy/deploy-server.ps1`
- `infra/deploy/smoke-check.ps1`
- `infra/deploy/rollback.ps1`

## Config
- Template: `infra/deploy/deploy.config.template.json`
- Local ignored config: `infra/deploy/deploy.config.local.json`
```

- [ ] **Step 2: Re-run the docs check**

Run: `pnpm check:docs`
Expected: exits successfully

- [ ] **Step 3: Re-run the Compose validation**

Run: `docker compose -f infra/deploy/server/compose.yaml config`
Expected: exits successfully and prints normalized Compose config

- [ ] **Step 4: Do a final PowerShell parse pass over all deploy scripts**

Run: `powershell -NoProfile -Command "Get-ChildItem infra/deploy/*.ps1 | ForEach-Object { [void][System.Management.Automation.Language.Parser]::ParseFile($_.FullName,[ref]$null,[ref]$null) }"`
Expected: exits successfully with no parse errors

- [ ] **Step 5: Commit**

```bash
git add docs/operations/deployment-workflow.md docs/operations/server-topology.md docs/superpowers/specs/2026-05-16-agentkid-docker-deploy-design.md infra/deploy skills/agentkid-docker-deploy .gitignore
git commit -m "feat: add repo-local docker deploy workflow"
```
