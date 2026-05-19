# Privacy and Safety

## Storage Baseline
- Do not store raw video in MVP.
- Do not store raw audio in MVP unless a future accepted decision changes this.
- Store transcript, emotion events, memories, lesson metadata, scores, AI notes, and alerts only as needed for product value.

## Consent Rules
- Parent consent must be explicit before mic and camera use.
- Consent copy must state that emotion inference uses camera input without storing raw video.
- The product must clearly say it does not replace professional therapy.

## Child-Safety Constraints
- Mia must use supportive, non-judgmental language.
- Child-facing UX should minimize overwhelm and abrupt sensory load.
- Escalation logic must be deterministic enough to review.

## Alert Boundaries
- Warning events use push only.
- Critical events escalate to push plus available SMS and Zalo channels.
- Delivery failure on one channel must not erase the alert record.
