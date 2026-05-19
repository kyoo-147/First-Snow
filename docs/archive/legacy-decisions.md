# AgentKid Architecture Decisions

## ADR-001: Vietnamese-First Child Experience
- Status: accepted
- Decision: Mia speaks Vietnamese only in child-facing interaction.
- Rationale: The target users are Vietnamese children with language support needs; code-switching increases confusion and weakens consistency.

## ADR-002: Mia Is a Cartoon Human, Not a Robot
- Status: accepted
- Decision: The assistant persona is a friendly cartoon human.
- Rationale: The product aims to support emotional familiarity and social modeling rather than present as a generic robot assistant.

## ADR-003: Google Cloud for Core AI Runtime
- Status: accepted
- Decision: Use Google STT, Google TTS, Gemini, and Google embeddings in the MVP baseline.
- Rationale: The input notes prioritize Vietnamese voice quality and lower orchestration complexity across the voice stack.

## ADR-004: On-Device Emotion Detection
- Status: accepted
- Decision: Use `face-api.js` in the browser for emotion inference.
- Rationale: This reduces privacy risk and server cost, and avoids transmitting video frames for routine inference.

## ADR-005: Parent Approval for AI-Generated Lessons
- Status: accepted
- Decision: AI-generated lessons enter the system as `suggested` and require parent approval before normal use.
- Rationale: This reduces lesson-quality risk and gives parents oversight for a sensitive child-facing workflow.

## ADR-006: No Raw Video or Audio Storage in MVP
- Status: accepted
- Decision: Do not persist raw video or raw audio in the MVP.
- Rationale: This keeps privacy posture simpler and aligns with the current home-practice scope.

## ADR-007: Documentation-First Foundation Before Production Code
- Status: accepted
- Decision: Build canonical docs, plans, and task scaffolding before implementation.
- Rationale: The source notes are rich but overlapping; formalizing them reduces ambiguity for all later coding work.
