// src/__tests__/companion/alert-resilience.test.ts
// Run: npx ts-node --skipProject --compilerOptions '{"module":"commonjs","esModuleInterop":true,"skipLibCheck":true}' src/__tests__/companion/alert-resilience.test.ts

import { markAlertRead, CompanionApiError } from "../../lib/companion-client";

let passed = 0;
let failed = 0;

function assert(c: boolean, m: string) {
  if (c) {
    console.log(`  ✓ ${m}`);
    passed++;
  } else {
    console.error(`  ✗ ${m}`);
    failed++;
  }
}

async function withMockFetch(handler: () => Response, fn: () => Promise<void>) {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => handler();
  try {
    await fn();
  } finally {
    globalThis.fetch = orig;
  }
}

// Simulate the UI's safe handler
async function safeMarkRead(alertId: string): Promise<{ success: boolean; warning?: string }> {
  try {
    await markAlertRead(alertId);
    return { success: true };
  } catch (e) {
    if (e instanceof CompanionApiError && e.status === 404) {
      return { success: false, warning: "Alert no longer available" };
    }
    throw e;
  }
}

async function main() {
  console.log("=== alert resilience tests ===\n");

  // T1: 200 PATCH returns success
  await withMockFetch(
    () =>
      new Response(
        JSON.stringify({
          id: "a-1",
          readAt: "2026-01-01T00:00:00Z",
          childId: "c1",
          title: "t",
          description: "d",
          severity: "low",
          createdAt: "2026-01-01T00:00:00Z",
        }),
        { status: 200 },
      ),
    async () => {
      const r = await safeMarkRead("a-1");
      assert(r.success === true, "safeMarkRead: 200 returns success");
      assert(!r.warning, "safeMarkRead: 200 has no warning");
    },
  );

  // T2: 404 PATCH returns warning without throwing
  await withMockFetch(
    () => new Response(JSON.stringify({ error: "not found" }), { status: 404 }),
    async () => {
      const r = await safeMarkRead("gone");
      assert(r.success === false, "safeMarkRead: 404 returns failure");
      assert(
        r.warning === "Alert no longer available",
        "safeMarkRead: 404 returns warning message",
      );
    },
  );

  // T3: 500 PATCH re-throws (not silently swallowed)
  await withMockFetch(
    () => new Response("server error", { status: 500 }),
    async () => {
      try {
        await safeMarkRead("a-1");
        assert(false, "safeMarkRead: 500 should re-throw");
      } catch (e) {
        assert(
          e instanceof CompanionApiError,
          "safeMarkRead: 500 re-throws CompanionApiError",
        );
      }
    },
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
