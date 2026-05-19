# Session Lifecycle

## States
- `created`: conceptual pre-start state before persistence
- `active`: live session in progress
- `completed`: session ended normally
- `interrupted`: session ended unexpectedly or manually aborted

In persisted data, MVP stores `active`, `completed`, and `interrupted`.

## Flow
1. Parent starts a session for a child.
2. Session record is created as `active`.
3. Consent and media permissions are confirmed.
4. Voice loop runs with transcript persistence and emotion sampling.
5. Alert checks run on relevant user input and emotion history.
6. Session ends as `completed` or `interrupted`.
7. Post-session async work may extract memories, compute score, and produce AI notes.

## Branching Rules
- If media permission fails, session may never fully enter interactive mode.
- If connectivity fails mid-session, state may end as `interrupted`.
- If alert conditions occur, alert delivery runs without blocking the child-facing loop more than necessary.

## Post-Session Jobs
- Memory extraction
- Memory embedding and storage
- Progress scoring
- AI notes generation

These jobs should be safe to retry and should not mutate ownership relationships.
