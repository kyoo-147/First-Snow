# GitHub Development Workflow

## Purpose
- This document is the canonical GitHub operating model for AgentKid.
- It defines how code is written, reviewed, merged, released, deployed, and recovered in a solo-but-production-style workflow.

## Source Of Truth
- GitHub is the primary source of truth for application code and history.
- Docker Hub is the source of truth for built image history.
- The production server keeps `/opt/agentkid/.state/last-known-good.json` as the deployment rollback source of truth.

## Branch Model
- `main` is the protected production branch.
- All implementation starts from a branch under one of these prefixes:
  - `feature/*`
  - `fix/*`
  - `chore/*`
- Preferred examples:
  - `feature/login-flow`
  - `fix/dashboard-routing`

## Commit Convention
- Use Conventional Commit style at the top level:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
- Keep commits focused so each commit can be reviewed, reverted, and described independently.

## Pull Request Model
- Do not push directly to `main`.
- Open a PR for every branch before merge.
- Use squash merge for `main`.
- Require CI checks to pass before merge.
- Feature branches may be deployed for live testing before merge when explicitly requested or operationally useful.

## CI Contract
- GitHub Actions is the required CI system for this repo.
- Every push and PR should run:
  - `lint`
  - `typecheck`
  - `test`
  - Docker image build verification
- CI should fail fast if repo-wide scripts or Docker build scripts stop working on a clean runner.

## Release And Tag Model
- Use immutable image tags for container rollout identity.
- Use semantic version tags such as `v0.1.0` for product releases on `main`.
- Use deploy identifiers such as `deploy-20260518-001` for deployment bookkeeping and release records.
- After a successful production deploy, create a GitHub Release with short release notes.

## Standard Delivery Flow
1. Create a working branch from `main`.
2. Implement locally.
3. Run local checks relevant to the change.
4. Commit with the agreed commit convention.
5. Push the branch to GitHub.
6. Let GitHub Actions run `lint`, `typecheck`, `test`, and Docker build verification.
7. Open or update a PR.
8. If needed, deploy the branch build for live validation.
9. Merge to `main` through squash merge after checks pass.
10. Build and publish the deployment image.
11. Deploy to the server with the canonical Docker workflow.
12. Run smoke checks.
13. Record the successful deploy through release notes and last-known-good state.

## Backup And Recovery
- GitHub preserves source history and review history.
- Docker Hub preserves deployable image history.
- The server rollback record preserves the last verified runtime target.
- If production breaks after deploy:
  - inspect logs
  - roll back to the recorded last-known-good image
  - document the incident in the next PR or release notes

## AI Operating Permissions
- The AI agent is allowed to:
  - create branches
  - commit
  - push
  - open PRs
  - merge when checks pass
  - deploy production
- The AI should still pause for confirmation on high-risk infrastructure changes, auth setup, destructive operations, or when the requested action can affect production outside the documented workflow.

## Unresolved External Setup
- The exact GitHub repository slug should be discovered from the git remote when available.
- If the local workspace is detached from `.git` or the remote is missing, ask the user for the repo slug before performing live GitHub operations.
