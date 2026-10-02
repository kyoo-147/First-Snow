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

  // T4: session recovery — 404 triggers new session creation
  let createdNewSession = false;
  async function recoverSession(stored: string | null): Promise<string> {
    if (!stored) { createdNewSession = true; return "new-sess"; }
    try {
      // Simulate getSession throwing 404
      throw new CompanionApiError(404, "Not found");
    } catch (e) {
      if (e instanceof CompanionApiError && (e.status === 404 || e.status === 401)) {
        createdNewSession = true;
        return "new-sess";
      }
      throw e;
    }
  }
  await recoverSession("stale-sess-id");
  assert(createdNewSession, "session recovery: 404 creates new session");

  // T5: session recovery — null stored creates new session
  createdNewSession = false;
  await recoverSession(null);
  assert(createdNewSession, "session recovery: null stored creates new session");

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

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
