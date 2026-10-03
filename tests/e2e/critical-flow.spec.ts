import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

test.describe("Snow release critical paths", () => {
  test("protects child routes before sign-in", async ({ page }) => {
    await page.goto("/session/home");
    await expect(page).toHaveURL(/\/auth\/child\/login|\/child-login/);
    await expect(page.getByRole("heading", { name: /welcome, friend/i })).toBeVisible();
  });

  test("registers a guardian, creates a child, signs in, and persists lesson completion", async ({ page }) => {
    const email = uniqueEmail();
    const childName = `E2E Learner ${Date.now()}`;
    const pin = "2468";

    await page.goto("/register");
    await page.getByLabel("Guardian Full Name").fill("E2E Guardian");
    await page.getByLabel("Guardian Email").fill(email);
    await page.getByLabel("Password").fill("E2E-password-123");
    await page.getByRole("button", { name: "Create Guardian Account" }).click();
    await expect(page).toHaveURL(/\/parent\/children$/);
    await expect(page.getByRole("heading", { name: "My children" })).toBeVisible();

    const createChild = await page.request.post("/api/children", {
      data: { name: childName, pin, age: 8, grade: "Grade 3" },
    });
    expect(createChild.status(), await createChild.text()).toBe(201);
    const child = (await createChild.json()).child as { id: string; name: string };
    expect(child.name).toBe(childName);

    await page.goto(`/child-login?childId=${encodeURIComponent(child.id)}`);
    await expect(page.getByRole("button", { name: new RegExp(childName) })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(childName) }).click();
    for (const digit of pin) {
      await page.getByRole("button", { name: `Digit ${digit}` }).click();
    }
    await expect(page).toHaveURL(/\/session\/home$/);
    await expect(page.getByText(/good morning|ready to learn|welcome back/i).first()).toBeVisible();

    const lessonsResponse = await page.request.get("/api/lessons");
    expect(lessonsResponse.status(), await lessonsResponse.text()).toBe(200);
    const lessons = (await lessonsResponse.json()).lessons as Array<{ id: string }>;
    expect(lessons.length).toBeGreaterThan(0);

    const attemptResponse = await page.request.post("/api/lesson-attempts", {
      data: { lessonId: lessons[0].id },
    });
    expect(attemptResponse.status(), await attemptResponse.text()).toBe(201);
    const attempt = (await attemptResponse.json()).attempt as { id: string };

    const completeResponse = await page.request.post(`/api/lesson-attempts/${attempt.id}/complete`, {
      data: {},
    });
    expect(completeResponse.status(), await completeResponse.text()).toBe(200);

    const childLogout = await page.request.post("/api/auth/child/logout");
    expect(childLogout.ok()).toBeTruthy();
    const parentLogin = await page.request.post("/api/auth/login", {
      data: { email, password: "E2E-password-123" },
    });
    expect(parentLogin.status(), await parentLogin.text()).toBe(200);
    const progressResponse = await page.request.get(`/api/children/${child.id}/progress`);
    expect(progressResponse.status(), await progressResponse.text()).toBe(200);
    const progress = (await progressResponse.json()).progress as Array<unknown>;
    expect(progress.length).toBeGreaterThan(0);
  });
});
