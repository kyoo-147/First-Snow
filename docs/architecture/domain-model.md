# Domain Model

## Entity Relationships
- One `ParentProfile` owns many `Child` records.
- One `Child` owns many `Session`, `Lesson`, and `Memory` records.
- One `Session` owns many `Message`, `EmotionEvent`, and `Alert` records.

## Ownership Chain
- Authorization roots at the authenticated subject from the chosen auth provider.
- `users.auth_subject_id` maps 1:1 to that external auth subject.
- `users.id` is the internal parent profile UUID used by AgentKid records.
- All downstream access resolves through the parent -> child -> session chain.

## Business Invariants
- A child must belong to exactly one parent.
- A session must belong to exactly one child.
- A message cannot exist without a session.
- An emotion event cannot exist without a session.
- A lesson suggestion is not eligible for normal use until approved.
- Long-term memories are distilled facts, not raw transcript mirrors.
- Alerts must be persisted even if not every delivery channel succeeds.
