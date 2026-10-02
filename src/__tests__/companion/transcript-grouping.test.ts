// src/__tests__/companion/transcript-grouping.test.ts
// Run: npx ts-node --skipProject --compilerOptions '{"module":"commonjs","esModuleInterop":true,"skipLibCheck":true,"lib":["ES2020","DOM"]}' src/__tests__/companion/transcript-grouping.test.ts

import type { ApiTranscriptMessage } from "../../lib/companion-client";

let passed = 0;
let failed = 0;

function assert(c: boolean, m: string) {
  if (c) { console.log(`  ✓ ${m}`); passed++; }
  else { console.error(`  ✗ ${m}`); failed++; }
}

export function groupBySession(messages: ApiTranscriptMessage[]): Map<string, ApiTranscriptMessage[]> {
  const map = new Map<string, ApiTranscriptMessage[]>();
  for (const msg of messages) {
    if (!map.has(msg.sessionId)) map.set(msg.sessionId, []);
    map.get(msg.sessionId)!.push(msg);
  }
  return map;
}

async function main() {
  console.log("=== transcript grouping tests ===\n");

  const msgs: ApiTranscriptMessage[] = [
    { id: "m1", sessionId: "s1", role: "child", content: "hi", createdAt: "2026-01-01T00:00:00Z" },
    { id: "m2", sessionId: "s1", role: "assistant", content: "hello", createdAt: "2026-01-01T00:00:01Z" },
    { id: "m3", sessionId: "s2", role: "child", content: "bye", createdAt: "2026-01-01T00:01:00Z" },
  ];

  const grouped = groupBySession(msgs);
  assert(grouped.size === 2, "groupBySession: 2 distinct sessions");
  assert(grouped.get("s1")!.length === 2, "groupBySession: s1 has 2 messages");
  assert(grouped.get("s2")!.length === 1, "groupBySession: s2 has 1 message");

  // Empty array
  const empty = groupBySession([]);
  assert(empty.size === 0, "groupBySession: empty input returns empty map");

  // Session order preserves insertion order
  const keys = Array.from(grouped.keys());
  assert(keys[0] === "s1" && keys[1] === "s2", "groupBySession: session order preserved");

  // Transcript status tiles truthfulness
  function formatTranscriptStatusTiles(
    status: "loading" | "error" | "ready",
    activeSession: { id: string; firstAt: string } | null,
    transcriptsCount: number,
  ) {
    const isReady = status === "ready";
    return {
      latestSession: {
        value: isReady
          ? activeSession
            ? `Session ${activeSession.id.slice(-6)}`
            : "No sessions"
          : "—",
        detail: isReady
          ? activeSession
            ? activeSession.firstAt
            : "No session records"
          : "Status unavailable",
      },
      storedTranscript: {
        value: isReady ? `${transcriptsCount} messages` : "—",
        detail: isReady ? "Records for session" : "Status unavailable",
      },
    };
  }

  const loadingTiles = formatTranscriptStatusTiles("loading", null, 0);
  assert(loadingTiles.latestSession.value === "—", "formatTranscriptStatusTiles: loading shows '—'");
  assert(loadingTiles.latestSession.detail === "Status unavailable", "formatTranscriptStatusTiles: loading shows 'Status unavailable'");
  assert(loadingTiles.storedTranscript.value === "—", "formatTranscriptStatusTiles: loading shows '—' for stored transcripts");

  const errorTiles = formatTranscriptStatusTiles("error", null, 0);
  assert(errorTiles.latestSession.value === "—", "formatTranscriptStatusTiles: error shows '—'");

  const readyTiles = formatTranscriptStatusTiles("ready", { id: "sess-abcdef", firstAt: "2026-01-01T00:00:00Z" }, 5);
  assert(readyTiles.latestSession.value === "Session abcdef", "formatTranscriptStatusTiles: ready shows session slice");
  assert(readyTiles.storedTranscript.value === "5 messages", "formatTranscriptStatusTiles: ready shows message count");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
