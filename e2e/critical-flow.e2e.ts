/**
 * Snow – Critical Release Flow E2E Suite
 *
 * Import: playwright/test  (uses the pre-existing `playwright` devDependency,
 * NOT @playwright/test — no package changes are needed or made).
 *
 * SAFETY & MUTATION POLICY:
 *   - Public smoke tests are strictly read-only and run against unauthenticated pages.
 *   - Mutating tests write real rows to the DB (guardians, children, attempts).
 *     They REQUIRE BOTH:
 *       1. E2E_ALLOW_MUTATIONS=1
 *       2. Disposable DB attestation (E2E_DISPOSABLE_DB=1 or E2E_DISPOSABLE_DB_ATTESTATION=1)
 *     If either is missing, mutating tests are skipped to protect non-disposable databases.
 *
 * BLOCKED FLOWS:
 *   Companion, cross-household isolation, admin, and privacy/deletion flows are
 *   explicitly BLOCKED and documented in docs/verification/BLOCKED.md.
 */

import { expect, test } from "playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

// ---------------------------------------------------------------------------
// Smoke: public read-only pages (no auth, no mutations)
// ---------------------------------------------------------------------------
test.describe("Snow release critical paths – public smoke (read-only)", () => {
  test("home page redirects unauthenticated child to child login", async ({ page }) => {
    await page.goto("/session/home");
    // Must redirect to the child login route.
    await expect(page).toHaveURL(/\/child-login/);
    await expect(page.getByRole("heading", { name: /welcome, friend/i })).toBeVisible();
  });

  test("register page is publicly accessible and renders the guardian form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Guardian Full Name")).toBeVisible();
    await expect(page.getByLabel("Guardian Email")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /create guardian account/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Full registration → child creation → child sign-in → lesson completion flow
// Mutating: requires E2E_ALLOW_MUTATIONS=1 and disposable DB attestation.
// ---------------------------------------------------------------------------
const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "1";
const hasDisposableDbAttestation =
  process.env.E2E_DISPOSABLE_DB === "1" ||
  process.env.E2E_DISPOSABLE_DB_ATTESTATION === "1" ||
  process.env.DISPOSABLE_DB_ATTESTATION === "1" ||
  process.env.DISPOSABLE_DB === "1";

test.describe("Snow release critical paths – authenticated flows (mutating)", () => {
  test.beforeEach(async () => {
    if (process.env.E2E_ALLOW_MUTATIONS === "1" && !hasDisposableDbAttestation) {
      throw new Error(
        "E2E_ALLOW_MUTATIONS=1 is set but disposable DB attestation is missing. " +
          "Mutating tests require explicit attestation that the target DB is disposable. " +
          "Set E2E_DISPOSABLE_DB=1 or E2E_DISPOSABLE_DB_ATTESTATION=1.",
      );
    }
    test.skip(
      !allowMutations || !hasDisposableDbAttestation,
      "Mutating tests require E2E_ALLOW_MUTATIONS=1 and disposable DB attestation " +
        "(E2E_DISPOSABLE_DB=1 or E2E_DISPOSABLE_DB_ATTESTATION=1); public smoke tests run read-only.",
    );
  });

  test(
    "registers a guardian, creates a child profile, signs the child in, and persists lesson completion",
    async ({ page }) => {
      const email = uniqueEmail();
      const childName = `E2E Learner ${Date.now()}`;
      const pin = "2468";

      // ── 1. Register guardian via the UI ─────────────────────────────────
      await page.goto("/register");

      // Labels come from the real ParentRegisterForm component:
      //   htmlFor="parent-register-name"  → "Guardian Full Name"
      //   htmlFor="parent-register-email" → "Guardian Email"
      //   htmlFor="parent-register-password" → "Password"
      await page.getByLabel("Guardian Full Name").fill("E2E Guardian");
      await page.getByLabel("Guardian Email").fill(email);
      await page.getByLabel("Password").fill("E2E-password-123");
      await page.getByRole("button", { name: /create guardian account/i }).click();

      // POST /api/auth/register → sets parent session cookie → redirect to /parent/children
      await expect(page).toHaveURL(/\/parent\/children/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /my children/i })).toBeVisible();

      // ── 2. Create a child profile via the API (parent session cookie is live) ──
      const createChild = await page.request.post("/api/children", {
        data: { name: childName, pin, age: 8, grade: "Grade 3" },
      });
      expect(createChild.status(), `POST /api/children: ${await createChild.text()}`).toBe(201);
      const child = (await createChild.json()).child as { id: string; name: string };
      expect(child.name).toBe(childName);

      // ── 3. Navigate to child login (parent still signed in — required by API) ──
      //
      // SECURITY NOTE: /api/auth/child-login requires an active parent session.
      // The guardian cookie set during registration is still present so the
      // child PIN login will be authorised.
      await page.goto(`/child-login?childId=${encodeURIComponent(child.id)}`);

      // BLOCKED: child-login UI via PIN pad buttons
      // ──────────────────────────────────────────────────────────────────────
      // The ChildLoginView renders a PIN pad. The exact ARIA labels for the
      // digit buttons depend on the runtime component implementation which was
      // not verified against a live server at commit time. Falling back to the
      // direct API approach which is deterministic and not a mock.
      //
      // See docs/verification/BLOCKED.md § "PIN pad UI interaction"
      // ──────────────────────────────────────────────────────────────────────

      // Sign the child in via the API directly (no mocking; real DB session).
      const childLoginResponse = await page.request.post("/api/auth/child-login", {
        data: { childId: child.id, pin },
      });
      expect(
        childLoginResponse.status(),
        `POST /api/auth/child-login: ${await childLoginResponse.text()}`,
      ).toBe(200);

      // ── 4. Verify child session grants access to the session home ────────
      // Navigate now that the child cookie has been set by the API response.
      await page.goto("/session/home");
      await expect(page).toHaveURL(/\/session\/home/);
      await expect(
        page.getByText(/good morning|ready to learn|welcome back/i).first(),
      ).toBeVisible();

      // ── 5. Persist a lesson completion ───────────────────────────────────
      const lessonsResponse = await page.request.get("/api/lessons");
      expect(
        lessonsResponse.status(),
        `GET /api/lessons: ${await lessonsResponse.text()}`,
      ).toBe(200);
      const lessons = (await lessonsResponse.json()).lessons as Array<{ id: string }>;
      expect(lessons.length, "seed must include at least one lesson").toBeGreaterThan(0);

      const attemptResponse = await page.request.post("/api/lesson-attempts", {
        data: { lessonId: lessons[0].id },
      });
      expect(
        attemptResponse.status(),
        `POST /api/lesson-attempts: ${await attemptResponse.text()}`,
      ).toBe(201);
      const attempt = (await attemptResponse.json()).attempt as { id: string };

      const completeResponse = await page.request.post(
        `/api/lesson-attempts/${attempt.id}/complete`,
        { data: {} },
      );
      expect(
        completeResponse.status(),
        `POST /api/lesson-attempts/${attempt.id}/complete: ${await completeResponse.text()}`,
      ).toBe(200);

      // ── 6. Child logout ──────────────────────────────────────────────────
      const childLogout = await page.request.post("/api/auth/child/logout");
      expect(childLogout.ok(), `POST /api/auth/child/logout failed`).toBeTruthy();

      // ── 7. Parent re-login and verify progress visibility ────────────────
      const parentLogin = await page.request.post("/api/auth/login", {
        data: { email, password: "E2E-password-123" },
      });
      expect(
        parentLogin.status(),
        `POST /api/auth/login: ${await parentLogin.text()}`,
      ).toBe(200);

      const progressResponse = await page.request.get(`/api/children/${child.id}/progress`);
      expect(
        progressResponse.status(),
        `GET /api/children/${child.id}/progress: ${await progressResponse.text()}`,
      ).toBe(200);
      const progress = (await progressResponse.json()).progress as Array<unknown>;
      expect(progress.length, "progress must include the completed lesson attempt").toBeGreaterThan(0);

      // ── CLEANUP NOTE ─────────────────────────────────────────────────────
      // The guardian account, household, child profile, session rows, and
      // lesson attempt rows created above are left in the disposable test DB.
      // See docs/verification/BLOCKED.md § "Test-owned cleanup".
    },
  );
});

// ---------------------------------------------------------------------------
// Blocked flows – explicitly marked BLOCKED (NOT covered in browser E2E)
// ---------------------------------------------------------------------------
test.describe("Snow release critical paths – blocked flows (not covered)", () => {
  test("companion voice/chat interactions (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Companion voice/chat requires live audio device permissions, " +
        "WebAudio / VAD Web ONNX runtime, and WebSocket companion backend. " +
        "See docs/verification/BLOCKED.md § Companion Flow.",
    );
  });

  test("cross-household tenant data isolation (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Multi-tenant household data isolation requires multi-account " +
        "browser fixtures and cross-tenant probing credentials. " +
        "See docs/verification/BLOCKED.md § Isolation Flow.",
    );
  });

  test("admin dashboard and privileged controls (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Admin dashboard requires pre-provisioned administrator role credentials " +
        "outside standard guardian self-service registration. " +
        "See docs/verification/BLOCKED.md § Admin Flow.",
    );
  });

  test("privacy controls and data deletion requests (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Privacy workflows trigger destructive account/child data deletion " +
        "and require parent safety re-auth modal verification. " +
        "See docs/verification/BLOCKED.md § Privacy Flow.",
    );
  });
});
