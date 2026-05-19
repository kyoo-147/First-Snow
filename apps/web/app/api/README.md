# Web API Routes

Route handlers here should stay thin and delegate business logic to domain-aware modules and shared packages.

## Current Implementation
- `identity/*` routes implement a prototype signed-session flow only.
- Conversation, session, child profile, lesson, alert, and reporting routes are still pending.
- Production persistence must not be implied until the server PostgreSQL migration has been applied and route handlers enforce parent profile ownership.
