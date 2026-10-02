// src/__tests__/companion/companion-client.test.ts
// Run: npx ts-node --skipProject --compilerOptions '{"module":"commonjs","esModuleInterop":true,"skipLibCheck":true,"lib":["ES2020","DOM"]}' src/__tests__/companion/companion-client.test.ts
// Requires: global fetch (Node 18+)
import { createSession, getSession, sendMessage, getMessages, getAlerts, markAlertRead, CompanionApiError } from "../../lib/companion-client";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

async function withMockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Response, fn: () => Promise<void>) {
  const orig = globalThis.fetch;
  (globalThis as unknown as Record<string, unknown>)["fetch"] = async (input: RequestInfo | URL, init?: RequestInit) => handler(input, init);
  try { await fn(); } finally { (globalThis as unknown as Record<string, unknown>)["fetch"] = orig; }
}

async function main() {
  console.log("=== companion-client contract tests ===\n");

  // T1: createSession happy path
  await withMockFetch(
    () => new Response(JSON.stringify({ id: "sess-1", childId: "c1", createdAt: "2026-01-01T00:00:00Z", status: "active" }), { status: 201 }),
    async () => {
      const s = await createSession("c1");
      assert(s.id === "sess-1", "createSession: returns session id");
      assert(s.status === "active", "createSession: status is active");
    }
  );

  // T2: createSession error path — nested JSON body
  await withMockFetch(
    () => new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }), { status: 401 }),
    async () => {
      try {
        await createSession("c1");
        assert(false, "createSession: should throw on 401");
      } catch (e) {
        assert(e instanceof CompanionApiError, "createSession: throws CompanionApiError");
        assert((e as CompanionApiError).status === 401, "createSession: error has status 401");
      }
    }
  );

  // T3: createSession error with non-JSON body (safe parse)
  await withMockFetch(
    () => new Response("Internal Server Error", { status: 500 }),
    async () => {
      try {
        await createSession("c1");
        assert(false, "createSession: should throw on 500");
      } catch (e) {
        assert(e instanceof CompanionApiError, "createSession: 500 non-JSON throws CompanionApiError");
        assert((e as CompanionApiError).status === 500, "createSession: error status 500");
      }
    }
  );

  // T4: sendMessage idempotent field
  let capturedBody: Record<string, unknown> | null = null;
  await withMockFetch(
    (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ id: "m-1", clientMessageId: "uid-1", sessionId: "sess-1", role: "child", content: "hello", createdAt: "2026-01-01T00:00:00Z" }), { status: 201 });
    },
    async () => {
      const msg = await sendMessage("sess-1", "uid-1", "hello");
      assert(capturedBody?.clientMessageId === "uid-1", "sendMessage: sends clientMessageId");
      assert(msg.clientMessageId === "uid-1", "sendMessage: response includes clientMessageId");
    }
  );

  // T5: getMessages returns array
  await withMockFetch(
    () => new Response(JSON.stringify([{ id: "m-2", sessionId: "sess-1", role: "assistant", content: "hi", createdAt: "2026-01-01T00:00:00Z" }]), { status: 200 }),
    async () => {
      const msgs = await getMessages("sess-1");
      assert(Array.isArray(msgs), "getMessages: returns array");
      assert(msgs[0].role === "assistant", "getMessages: first message role");
    }
  );

  // T6: markAlertRead happy path
  await withMockFetch(
    () => new Response(JSON.stringify({ id: "a-1", childId: "c1", title: "t", description: "d", severity: "low", createdAt: "2026-01-01T00:00:00Z", readAt: "2026-01-01T00:00:00Z" }), { status: 200 }),
    async () => {
      const alert = await markAlertRead("a-1");
      assert(alert.readAt !== null, "markAlertRead: readAt is set");
    }
  );

  // T7: markAlertRead 404 — throws CompanionApiError
  await withMockFetch(
    () => new Response(JSON.stringify({ error: "not found" }), { status: 404 }),
    async () => {
      try {
        await markAlertRead("gone");
        assert(false, "markAlertRead: should throw on 404");
      } catch (e) {
        assert(e instanceof CompanionApiError, "markAlertRead: 404 throws CompanionApiError");
        assert((e as CompanionApiError).status === 404, "markAlertRead: status 404");
      }
    }
  );

  // T8: getSession happy path
  await withMockFetch(
    () => new Response(JSON.stringify({ id: "sess-1", childId: "c1", createdAt: "2026-01-01T00:00:00Z", status: "active" }), { status: 200 }),
    async () => {
      const s = await getSession("sess-1");
      assert(s.id === "sess-1", "getSession: returns session id");
    }
  );

  // T9: getAlerts returns array
  await withMockFetch(
    () => new Response(JSON.stringify([{ id: "a-1", childId: "c1", title: "Alert", description: "desc", severity: "low", createdAt: "2026-01-01T00:00:00Z", readAt: null }]), { status: 200 }),
    async () => {
      const alerts = await getAlerts("c1");
      assert(Array.isArray(alerts), "getAlerts: returns array");
      assert(alerts[0].id === "a-1", "getAlerts: first alert id matches");
    }
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
