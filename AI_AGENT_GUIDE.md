# AI Agent Guide

## Canonical Read Order
1. `README.md`
2. `PROJECT_OVERVIEW.md`
3. `ARCHITECTURE.md`
4. `API_SPEC.md`
5. `CODING_STANDARDS.md`
6. relevant docs under `docs/`
7. relevant task under `tasks/`

## AIContextRecoveryFlow
1. Re-read `README.md`
2. Identify the target domain module
3. Read the corresponding architecture, engineering, and operations docs
4. Read the current task
5. Check ADRs if a design decision is involved

## Context Rules
- Root canonical docs win over adapter files.
- `docs/archive/` is historical input, not live product truth.
- If an implementation changes architecture or contracts, update canonical docs first.
