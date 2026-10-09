# Mia latency path and telemetry

## Scope

The text companion path is intentionally fail-closed:

`UI input -> child session/auth -> owned session -> idempotent DB input -> safety precheck -> bounded history -> provider -> output safety -> DB assistant persistence -> UI render/poll`

The API preserves the existing response contracts. Each companion message request receives an `x-correlation-id` response header. Server telemetry records only `correlationId`, `phase`, `durationMs`, and `outcome`; it never records message text, child data, credentials, or raw provider/database errors.

## Safe latency changes

- Provider history is deterministic and bounded to the newest 20 messages plus the current input.
- The normal send path uses one bounded history read for provider context. Retry idempotency checks remain narrow and do not bypass the client-message uniqueness contract.
- Provider instances are cached while configuration is unchanged, preserving routing state and avoiding per-request setup.
- Provider requests advertise HTTP keep-alive. Timeouts, bounded payloads, failover, and bounded retries remain enforced.
- The UI disables send and mood controls while a send is in flight. A timed-out request remains visibly retryable rather than being silently marked successful.

## Configuration

`COMPANION_PROVIDER` accepts only `deepseek`, `gemini`, or `openai` when explicitly selected. With no explicit selection, auto-detection is DeepSeek first, then Gemini, then OpenAI. Production should explicitly set:

```dotenv
COMPANION_PROVIDER=deepseek
COMPANION_DEEPSEEK_MODEL=deepseek-chat
COMPANION_PROVIDER_TIMEOUT_MS=15000
COMPANION_PROVIDER_MAX_ATTEMPTS=3
```

Keys must be supplied through the deployment secret store. Never paste or commit a key in source, logs, tests, or chat. The timeout, model list, retry, payload, and routing knobs are documented in `.env.example` and `AI_PROVIDER_CONFIGURATION.md`.

## Verification status

- **VERIFIED by tests:** provider config accepts the three supported provider names; provider timeout/retry/payload limits and output safety contracts remain covered by the existing companion suites.
- **UNVERIFIED:** production p50/p95 latency, real provider network timing, connection reuse, and browser render timing. No provider key or production environment was used in this worktree.
- **Required measurement:** collect redacted phase telemetry in a disposable authorized environment, then compare p50/p95 for `session_auth`, `db_history`, `safety_precheck`, `provider`, `output_safety`, `persistence`, and `render` by correlation ID. Do not export request content or child identifiers.
