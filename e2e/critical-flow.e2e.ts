/**
 * Snow – Critical Release Flow E2E Suite
 *
 * Import: playwright/test  (uses the pre-existing `playwright` devDependency,
 * NOT @playwright/test — no package changes are needed or made).
 *
 * SAFETY & MUTATION POLICY:
 *   - Public smoke tests are strictly read-only and run against unauthenticated pages.
 *   - Mutating tests write real rows to the DB (guardians, children, attempts, consents).
 *     They REQUIRE BOTH:
 *       1. E2E_ALLOW_MUTATIONS=1
 *       2. Disposable DB attestation (E2E_DISPOSABLE_DB=1 or E2E_DISPOSABLE_DB_ATTESTATION=1)
 *     If either is missing, mutating tests are skipped to protect non-disposable databases.
 *
 * GENUINELY BLOCKED FLOWS:
 *   Live2D model rendering, live external audio streaming, and test-owned direct DB teardown
 *   remain genuinely blocked and documented in docs/verification/BLOCKED.md.
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
// Authenticated Critical Release Flows (Mutating)
// Requires E2E_ALLOW_MUTATIONS=1 and disposable DB attestation.
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
      test.setTimeout(120_000);
      const email = uniqueEmail();
      const childName = `E2E Learner ${Date.now()}`;
      const pin = "2468";

      // ── 1. Register guardian via the UI ─────────────────────────────────
      await page.goto("/register");
      await page.getByLabel("Guardian Full Name").fill("E2E Guardian");
      await page.getByLabel("Guardian Email").fill(email);
      await page.getByRole("textbox", { name: "Password", exact: true }).fill("E2E-password-123");
      await page.getByRole("button", { name: /create guardian account/i }).click();

      // POST /api/auth/register → sets parent session cookie → redirect to /parent/children
      await expect(page).toHaveURL(/\/parent\/children/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /my children/i })).toBeVisible({ timeout: 30_000 });

      // ── 2. Create a child profile via the API (parent session cookie is live) ──
      const createChild = await page.request.post("/api/children", {
        data: { name: childName, pin, age: 8, grade: "Grade 3" },
      });
      expect(createChild.status(), `POST /api/children: ${await createChild.text()}`).toBe(201);
      const child = (await createChild.json()).child as { id: string; name: string };
      expect(child.name).toBe(childName);

      // ── 3. Navigate to child login (parent still signed in — required by API) ──
      await page.goto(`/child-login?childId=${encodeURIComponent(child.id)}`);

      // Use the real accessible PIN pad. The fourth digit submits and creates
      // the database-backed child session; no route interception is used.
      await expect(page.getByText(/enter your 4-digit secret pin/i)).toBeVisible({ timeout: 30_000 });
      for (const digit of pin) await page.getByRole("button", { name: `Digit ${digit}` }).click();

      // ── 4. Verify child session grants access to the session home ────────
      await expect(page).toHaveURL(/\/session\/home/, { timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name: /start with agentkid/i }),
      ).toBeVisible({ timeout: 30_000 });

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
      const progress = (await progressResponse.json()).progress as {
        lessonsCompleted: number;
        totalLessons: number;
      };
      expect(progress.lessonsCompleted, "completed lesson must be visible to the parent").toBeGreaterThan(0);
      expect(progress.totalLessons, "published catalog must remain visible").toBeGreaterThan(0);
    },
  );

  test(
    "companion-unavailable: surfaces truthful 503 provider unavailable when external AI is unconfigured",
    async ({ page }) => {
      const email = uniqueEmail();
      const childName = `Companion Kid ${Date.now()}`;
      const pin = "3579";

      // Register guardian
      await page.goto("/register");
      await page.getByLabel("Guardian Full Name").fill("Companion Guardian");
      await page.getByLabel("Guardian Email").fill(email);
      await page.getByRole("textbox", { name: "Password", exact: true }).fill("E2E-password-123");
      await page.getByRole("button", { name: /create guardian account/i }).click();
      await expect(page).toHaveURL(/\/parent\/children/, { timeout: 15_000 });

      // Create child
      const createChild = await page.request.post("/api/children", {
        data: { name: childName, pin, age: 7, grade: "Grade 2" },
      });
      expect(createChild.status()).toBe(201);
      const child = (await createChild.json()).child as { id: string };

      // Authenticate child
      const childLogin = await page.request.post("/api/auth/child-login", {
        data: { childId: child.id, pin },
      });
      expect(childLogin.status()).toBe(200);

      // Create companion session
      const sessionResponse = await page.request.post("/api/companion/sessions", {
        data: { childId: child.id },
      });
      expect(sessionResponse.status()).toBe(201);
      const session = (await sessionResponse.json()) as { id: string; status: string };
      expect(session.status).toBe("active");

      // Send message to companion session without external AI provider configured
      const messageResponse = await page.request.post(`/api/companion/sessions/${session.id}/messages`, {
        data: {
          clientMessageId: `msg-${Date.now()}`,
          content: "Hello Snow, can you help me with math?",
        },
      });

      // Product contract: 503 PROVIDER_UNAVAILABLE
      expect(messageResponse.status()).toBe(503);
      const errorJson = (await messageResponse.json()) as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe("PROVIDER_UNAVAILABLE");
      expect(errorJson.error.message).toContain("temporarily unavailable");

      // Child message must still be truthfully persisted in session history
      const historyResponse = await page.request.get(`/api/companion/sessions/${session.id}/messages`);
      expect(historyResponse.status()).toBe(200);
      const history = (await historyResponse.json()) as Array<{ role: string; content: string }>;
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].role).toBe("child");
      expect(history[0].content).toBe("Hello Snow, can you help me with math?");
    },
  );

  test(
    "cross-household tenant data isolation: prevents unauthorized access between households",
    async ({ browser }) => {
      test.setTimeout(120_000);
      const emailA = uniqueEmail();
      const emailB = uniqueEmail();
      const password = "E2E-password-123";

      // ── Context A: Household A ───────────────────────────────────────────
      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();

      await pageA.goto("/register");
      await pageA.getByLabel("Guardian Full Name").fill("Guardian A");
      await pageA.getByLabel("Guardian Email").fill(emailA);
      await pageA.getByRole("textbox", { name: "Password", exact: true }).fill(password);
      await pageA.getByRole("button", { name: /create guardian account/i }).click();
      await expect(pageA).toHaveURL(/\/parent\/children/, { timeout: 15_000 });

      const createChildA = await pageA.request.post("/api/children", {
        data: { name: "Child A", pin: "1111", age: 7, grade: "Grade 2" },
      });
      expect(createChildA.status()).toBe(201);
      const childA = (await createChildA.json()).child as { id: string };

      // ── Context B: Household B ───────────────────────────────────────────
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();

      await pageB.goto("/register");
      await pageB.getByLabel("Guardian Full Name").fill("Guardian B");
      await pageB.getByLabel("Guardian Email").fill(emailB);
      await pageB.getByRole("textbox", { name: "Password", exact: true }).fill(password);
      await pageB.getByRole("button", { name: /create guardian account/i }).click();
      await expect(pageB).toHaveURL(/\/parent\/children/, { timeout: 15_000 });

      const createChildB = await pageB.request.post("/api/children", {
        data: { name: "Child B", pin: "2222", age: 9, grade: "Grade 4" },
      });
      expect(createChildB.status()).toBe(201);

      // ── Isolation Check 1: Guardian B probes Child A's transcripts ────────
      const probeTranscripts = await pageB.request.get(`/api/children/${childA.id}/transcripts`);
      expect(probeTranscripts.status()).toBe(403);
      const transcriptsJson = (await probeTranscripts.json()) as { error: { code: string } };
      expect(transcriptsJson.error.code).toBe("FORBIDDEN");

      // ── Isolation Check 2: Guardian B probes Child A's alerts ─────────────
      const probeAlerts = await pageB.request.get(`/api/alerts?childId=${childA.id}`);
      expect(probeAlerts.status()).toBe(403);
      const alertsJson = (await probeAlerts.json()) as { error: { code: string } };
      expect(alertsJson.error.code).toBe("FORBIDDEN");

      // ── Isolation Check 3: Child B probes Child A's companion session ─────
      const childALogin = await pageA.request.post("/api/auth/child-login", {
        data: { childId: childA.id, pin: "1111" },
      });
      expect(childALogin.status()).toBe(200);

      const sessionAResponse = await pageA.request.post("/api/companion/sessions", {
        data: { childId: childA.id },
      });
      expect(sessionAResponse.status()).toBe(201);
      const sessionA = (await sessionAResponse.json()) as { id: string };

      const childBLogin = await pageB.request.post("/api/auth/child-login", {
        data: { childId: (await createChildB.json()).child.id, pin: "2222" },
      });
      expect(childBLogin.status()).toBe(200);

      const probeSession = await pageB.request.get(`/api/companion/sessions/${sessionA.id}/messages`);
      expect(probeSession.status()).toBe(403);
      const sessionJson = (await probeSession.json()) as { error: { code: string } };
      expect(sessionJson.error.code).toBe("FORBIDDEN");

      await contextA.close();
      await contextB.close();
    },
  );

  test(
    "parent admin denial: strictly denies non-admin parent from admin dashboard and telemetry",
    async ({ page }) => {
      const email = uniqueEmail();
      const password = "E2E-password-123";

      // Register guardian (assigned role: 'parent', NOT 'admin')
      await page.goto("/register");
      await page.getByLabel("Guardian Full Name").fill("Normal Parent");
      await page.getByLabel("Guardian Email").fill(email);
      await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
      await page.getByRole("button", { name: /create guardian account/i }).click();
      await expect(page).toHaveURL(/\/parent\/children/, { timeout: 15_000 });

      // 1. Direct API call to admin dashboard -> 403 Forbidden
      const adminApiResponse = await page.request.get("/api/admin/dashboard");
      expect(adminApiResponse.status()).toBe(403);
      const adminJson = (await adminApiResponse.json()) as { error: { code: string; message: string } };
      expect(adminJson.error.code).toBe("FORBIDDEN");
      expect(adminJson.error.message).toBe("Admin access required");

      // 2. Route guard sends a non-admin parent to the shipped login page.
      await page.goto("/admin/companion");
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    },
  );

  test(
    "privacy consent: verifies consent settings, enforces re-auth, and persists capability updates",
    async ({ page }) => {
      const email = uniqueEmail();
      const password = "E2E-password-123";

      // Register guardian
      await page.goto("/register");
      await page.getByLabel("Guardian Full Name").fill("Privacy Guardian");
      await page.getByLabel("Guardian Email").fill(email);
      await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
      await page.getByRole("button", { name: /create guardian account/i }).click();
      await expect(page).toHaveURL(/\/parent\/children/, { timeout: 15_000 });

      // 1. Navigate to /parent/privacy in browser -> renders privacy controls
      await page.goto("/parent/privacy");
      await expect(page.getByRole("heading", { name: /privacy and data controls/i })).toBeVisible();
      await expect(page.getByText("Microphone Voice Access")).toBeVisible();
      await expect(page.getByText("Camera Video Access")).toBeVisible();

      // 2. Fetch current privacy settings via API
      const getPrivacy = await page.request.get("/api/privacy");
      expect(getPrivacy.status()).toBe(200);
      const initialSettings = (await getPrivacy.json()) as { privacy: { microphoneAccess: boolean } };
      expect(typeof initialSettings.privacy.microphoneAccess).toBe("boolean");

      // 3. Attempt PATCH with invalid reauthPassword -> 403 fail-closed denial
      const badReauth = await page.request.patch("/api/privacy", {
        data: {
          microphoneAccess: true,
          reauthPassword: "wrong-password",
        },
      });
      expect(badReauth.status()).toBe(403);
      const badJson = (await badReauth.json()) as { error: { code: string } };
      expect(badJson.error.code).toBe("INVALID_PASSWORD");

      // 4. PATCH with valid reauthPassword -> 200 OK and updates consent
      const updateConsent = await page.request.patch("/api/privacy", {
        data: {
          microphoneAccess: true,
          cameraAccess: false,
          reauthPassword: password,
        },
      });
      expect(updateConsent.status()).toBe(200);
      const updatedSettings = (await updateConsent.json()) as {
        privacy: { microphoneAccess: boolean; cameraAccess: boolean };
      };
      expect(updatedSettings.privacy.microphoneAccess).toBe(true);
      expect(updatedSettings.privacy.cameraAccess).toBe(false);

      // 5. Verify GET /api/privacy reflects persisted changes
      const verifyGet = await page.request.get("/api/privacy");
      expect(verifyGet.status()).toBe(200);
      const verifiedSettings = (await verifyGet.json()) as {
        privacy: { microphoneAccess: boolean; cameraAccess: boolean };
      };
      expect(verifiedSettings.privacy.microphoneAccess).toBe(true);
      expect(verifiedSettings.privacy.cameraAccess).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// Genuinely Blocked External Flows
// External-provider, live audio capture hardware, and direct DB teardown
// ---------------------------------------------------------------------------
test.describe("Snow release critical paths – genuinely blocked external flows", () => {
  test("Live2D visual canvas model rendering & character assets (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Live2D visual canvas rendering requires external Live2D Cubism runtime " +
        "and character model assets unconfigured in headless CI. See docs/verification/BLOCKED.md.",
    );
  });

  test("Live external voice streaming & hardware microphone capture (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Live voice streaming requires physical microphone device permissions and " +
        "active upstream speech synthesis service. See docs/verification/BLOCKED.md.",
    );
  });

  test("Direct database-owned teardown / bulk tenant purge API (BLOCKED)", () => {
    test.skip(
      true,
      "BLOCKED: Application exposes no administrative bulk-deletion endpoint; " +
        "relies on disposable DB attestation. See docs/verification/BLOCKED.md.",
    );
  });
});
