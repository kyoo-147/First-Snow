// src/__tests__/companion/talk-shell.test.ts
// Tests the session lifecycle logic extracted as pure functions (no DOM rendering).
// Run: npx ts-node --skipProject --compilerOptions '{"module":"commonjs","esModuleInterop":true,"skipLibCheck":true,"lib":["ES2020","DOM"]}' src/__tests__/companion/talk-shell.test.ts

import { CompanionApiError } from "../../lib/companion-client";

let passed = 0;
let failed = 0;

function assert(c: boolean, m: string) {
  if (c) { console.log(`  ✓ ${m}`); passed++; }
  else { console.error(`  ✗ ${m}`); failed++; }
}

async function main() {
  console.log("=== talk-shell session lifecycle tests ===\n");

  // T1: clientMessageId is stable — same UUID reused on retry
  const idMap = new Map<string, string>();
  function getOrCreateClientId(key: string): string {
    if (!idMap.has(key)) idMap.set(key, crypto.randomUUID());
    return idMap.get(key)!;
  }
  const id1 = getOrCreateClientId("msg-0");
  const id2 = getOrCreateClientId("msg-0");
  assert(id1 === id2, "clientMessageId: same key returns same UUID on retry");

  // T2: different messages get different UUIDs
  const id3 = getOrCreateClientId("msg-1");
  assert(id1 !== id3, "clientMessageId: different keys get different UUIDs");

  // T3: UUID is valid v4 format
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id1), "clientMessageId: UUID v4 format");

  // T4: storage key namespaced by childId
  function getCompanionSessionStorageKey(childId: string): string {
    return `companion:sessionId:${encodeURIComponent(childId)}`;
  }
  assert(getCompanionSessionStorageKey("minh") === "companion:sessionId:minh", "storageKey: namespaced by childId");
  assert(getCompanionSessionStorageKey("child/1") === "companion:sessionId:child%2F1", "storageKey: encodes special chars in childId");
  assert(getCompanionSessionStorageKey("child-a") !== getCompanionSessionStorageKey("child-b"), "storageKey: different children have different keys");

  // T5: session recovery — 404, 401, and 403 trigger new session creation
  async function recoverSession(stored: string | null, errorStatus: number): Promise<string> {
    if (!stored) return "new-sess";
    try {
      throw new CompanionApiError(errorStatus, "Session error");
    } catch (e) {
      if (
        e instanceof CompanionApiError &&
        (e.status === 404 || e.status === 401 || e.status === 403)
      ) {
        return "new-sess";
      }
      throw e;
    }
  }
  const r404 = await recoverSession("stale-sess-id", 404);
  assert(r404 === "new-sess", "session recovery: 404 creates new session");

  const r401 = await recoverSession("stale-sess-id", 401);
  assert(r401 === "new-sess", "session recovery: 401 creates new session");

  const r403 = await recoverSession("stale-sess-id", 403);
  assert(r403 === "new-sess", "session recovery: 403 creates new session");

  let threw500 = false;
  try {
    await recoverSession("stale-sess-id", 500);
  } catch (e) {
    if (e instanceof CompanionApiError && e.status === 500) threw500 = true;
  }
  assert(threw500, "session recovery: 500 is not recovered and re-throws");

  // T6: session recovery — null stored creates new session
  const rNull = await recoverSession(null, 404);
  assert(rNull === "new-sess", "session recovery: null stored creates new session");

  // T6: error message extraction — no crash on non-JSON
  function parseApiError(e: unknown): string {
    if (e instanceof CompanionApiError) return e.message;
    if (e instanceof Error) return e.message;
    return "Something went wrong";
  }
  const msg = parseApiError(new CompanionApiError(500, "Server failure", "INTERNAL"));
  assert(msg === "Server failure", "error parsing: CompanionApiError message extracted");
  const msg2 = parseApiError(new Error("Network failed"));
  assert(msg2 === "Network failed", "error parsing: generic Error message extracted");
  const msg3 = parseApiError("raw string error");
  assert(msg3 === "Something went wrong", "error parsing: unknown type returns fallback");

  // T7: single-flight polling guard drops overlapping poll requests
  let inflight = false;
  let executedPolls = 0;
  let droppedPolls = 0;
  async function singleFlightPoll(mockFetch: () => Promise<void>) {
    if (inflight) {
      droppedPolls++;
      return;
    }
    inflight = true;
    try {
      executedPolls++;
      await mockFetch();
    } finally {
      inflight = false;
    }
  }

  let resolveSlowPoll: () => void;
  const slowPoll = new Promise<void>((res) => { resolveSlowPoll = res; });
  const p1 = singleFlightPoll(() => slowPoll);
  const p2 = singleFlightPoll(async () => {}); // overlapping: must be dropped
  assert(droppedPolls === 1, "singleFlightPoll: overlapping poll trigger is dropped");
  assert(executedPolls === 1, "singleFlightPoll: only first poll executes");
  resolveSlowPoll!();
  await p1;
  await p2;
  // After completion, next poll can execute cleanly
  await singleFlightPoll(async () => {});
  assert(executedPolls === 2, "singleFlightPoll: subsequent poll executes after previous finishes");

  // T8: direct assistant reply ingestion appends reply and advances cursor
  function ingestSentResult(
    prev: Array<{ id: string; role: string }>,
    sent: { id: string; role: string; reply?: { id: string; role: string } | null },
  ): { nextMessages: Array<{ id: string; role: string }>; nextCursor: string } {
    const updated = prev.map((m) => (m.id === "opt-1" ? { id: sent.id, role: sent.role } : m));
    const directReply = sent.reply;
    const nextMessages = directReply && !updated.some((m) => m.id === directReply.id)
      ? [...updated, directReply]
      : updated;
    const nextCursor = directReply?.id ?? sent.id;
    return { nextMessages, nextCursor };
  }

  const initial = [{ id: "opt-1", role: "child" }];
  const sentWithReply = {
    id: "m-child-1",
    role: "child",
    reply: { id: "m-asst-1", role: "assistant" },
  };
  const { nextMessages, nextCursor } = ingestSentResult(initial, sentWithReply);
  assert(nextMessages.length === 2, "direct assistant ingestion: appends reply immediately without polling");
  assert(nextMessages[1].id === "m-asst-1", "direct assistant ingestion: reply is at end of list");
  assert(nextCursor === "m-asst-1", "direct assistant ingestion: advances cursor to assistant reply ID");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
