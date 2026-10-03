#!/usr/bin/env tsx
/**
 * scripts/e2e/run.ts
 *
 * Convenience runner that validates environment and safety preconditions
 * before launching the Playwright E2E suite.
 *
 * Usage:
 *   npx tsx scripts/e2e/run.ts
 *
 * Options:
 *   E2E_BASE_URL=https://staging.example.com
 *     Run against an already-running server.
 *     If omitted, Playwright starts the local dev server automatically.
 *
 *   E2E_ALLOW_MUTATIONS=1 and E2E_DISPOSABLE_DB=1 (or E2E_DISPOSABLE_DB_ATTESTATION=1)
 *     Enable mutating tests (registration, child creation, lesson completion).
 *     Without these, tests run in public smoke read-only mode.
 */

import { execSync } from "child_process";

async function main() {
  const baseURL = process.env.E2E_BASE_URL;
  if (baseURL) {
    console.log(`[e2e] Running against external server: ${baseURL}`);
  } else {
    console.log("[e2e] No E2E_BASE_URL set — Playwright will start local dev server on port 3000.");
  }

  const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "1";
  const hasDisposableDb =
    process.env.E2E_DISPOSABLE_DB === "1" ||
    process.env.E2E_DISPOSABLE_DB_ATTESTATION === "1" ||
    process.env.DISPOSABLE_DB_ATTESTATION === "1" ||
    process.env.DISPOSABLE_DB === "1";

  if (allowMutations && !hasDisposableDb) {
    console.error(
      "\n[e2e] ERROR: E2E_ALLOW_MUTATIONS=1 is set, but disposable DB attestation is missing!\n" +
        "Mutating tests write rows to the database and require explicit confirmation that\n" +
        "the database is disposable. Set E2E_DISPOSABLE_DB=1 or E2E_DISPOSABLE_DB_ATTESTATION=1.\n",
    );
    process.exit(1);
  }

  if (!allowMutations || !hasDisposableDb) {
    console.log(
      "[e2e] Running in public smoke read-only mode.\n" +
        "      (To enable mutating tests, set E2E_ALLOW_MUTATIONS=1 and E2E_DISPOSABLE_DB=1)",
    );
  } else {
    console.log("[e2e] Mutation permissions and disposable DB attestation confirmed. Running mutating flows.");
  }

  if (!process.env.DATABASE_URL) {
    // Attempt to load from .env.local via next/env if available
    try {
      const { loadEnvConfig } = await import("@next/env");
      loadEnvConfig(process.cwd());
    } catch {
      // not fatal — let playwright or server surface missing database configuration
    }
  }

  try {
    execSync("npx playwright test --config playwright.config.ts", { stdio: "inherit" });
  } catch {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[e2e] Unexpected error:", err);
  process.exit(1);
});
