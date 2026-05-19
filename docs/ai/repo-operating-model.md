# Repo Operating Model

## Purpose
Tài liệu này mô tả cách repo được vận hành như một project operating system cho cả con người và coding agents.

## ProjectDocHierarchy
1. `PROJECT_OVERVIEW.md`
2. `ARCHITECTURE.md`
3. `API_SPEC.md`
4. `CODING_STANDARDS.md`
5. `DEVELOPMENT_GUIDE.md`
6. `DEPLOYMENT_GUIDE.md`
7. `FEATURE_ROADMAP.md`
8. `TASK_BREAKDOWN.md`
8. supporting docs in `docs/`

Conflict rule:
- Higher-priority docs win.
- A newer accepted decision in `docs/decisions/` may supersede an older lower-level document.

## TaskLifecycle
- `planned`: defined but not started
- `in_progress`: active implementation or active refinement
- `blocked`: waiting on dependency, decision, or external setup
- `done`: acceptance criteria met and docs synced

## Required Sync Rules
- Update `API_SPEC.md` when route contracts or API shape changes.
- Update `ARCHITECTURE.md` when runtime boundaries, module ownership, or system shape changes.
- Update `docs/decisions/` when a meaningful product or technical decision changes direction.
- Update `FEATURE_ROADMAP.md`, `TASK_BREAKDOWN.md`, or `tasks/` when planning or work tracking changes.

## ReviewTypes
- `code-review`
- `privacy-review`
- `api-review`
- `pilot-readiness-review`

## Operating Principle
- Canonical knowledge belongs in `docs/` or top-level product docs.
- Agent rules, skills, commands, and memory templates may summarize or orchestrate that knowledge, but must link back to canonical docs instead of duplicating them as a competing source of truth.
