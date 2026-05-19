---
name: agentkid-github-operations
description: Run AgentKid's GitHub operating workflow for branch creation, commits, pushes, pull requests, CI expectations, releases, and production-style delivery. Use when Codex needs to manage code through GitHub in the repo's standard company-style workflow.
---

# AgentKid GitHub Operations

## Required Read Order
1. `README.md`
2. `PROJECT_OVERVIEW.md`
3. `ARCHITECTURE.md`
4. `docs/ai/repo-operating-model.md`
5. `docs/operations/github-development-workflow.md`
6. `docs/operations/deployment-workflow.md`
7. `docs/operations/server-topology.md`
8. `infra/deploy/deploy.config.local.json`

## Operating Contract
- GitHub is the code source of truth.
- `main` is production and must stay protected.
- Work starts from `feature/*`, `fix/*`, or `chore/*`.
- Commits use `feat:`, `fix:`, or `chore:`.
- Changes land through PRs and squash merge.
- Feature branches may be deployed before merge when requested.
- Successful production deploys should end with a GitHub Release and short release notes.

## Standard Local Sequence
1. Detect or confirm the git remote and repo slug.
2. Create the correct working branch name.
3. Implement and verify locally.
4. Commit in focused chunks using the commit convention.
5. Push the branch.
6. Open or update the PR.
7. Check CI expectations: `lint`, `typecheck`, `test`, Docker build verification.
8. Merge through squash once checks pass.
9. Hand off to the Docker deploy workflow when rollout is requested.

## Guardrails
- Never push directly to `main`.
- Never merge to `main` while required checks are failing.
- If the workspace is missing `.git` or the remote is unknown, stop and recover the repo identity before attempting live GitHub mutations.
- If GitHub auth is missing, ask the user to connect or authenticate before attempting push, PR, merge, or release steps.
- Do not invent release tags arbitrarily. Use the repo's semver and deploy identifier rules from the GitHub workflow doc.

## CI Notes
- The repo expects GitHub Actions to run `lint`, `typecheck`, `test`, and Docker build verification on push and PR.
- Use the workspace install script before running repo-wide checks on a clean machine:
  `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/checks/install-workspace-deps.ps1`

## Release Notes Contract
- Keep release notes short and operationally useful.
- Include:
  - what changed
  - what was deployed
  - any rollout caveats
  - rollback reference when useful
