import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createHouseholdChild,
  fetchDashboardAlerts,
  fetchDashboardAttempts,
  fetchDashboardLessons,
  fetchDashboardProgress,
  fetchDashboardRoutines,
  fetchDashboardSession,
  fetchHouseholdChildren,
  getErrorMessage,
  localDateKey,
  markDashboardAlertRead,
} from "../dashboard-client";

describe("dashboard-client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the authenticated child session without inventing identity", async () => {
    const session = { actorType: "child", child: { id: "child-1", name: "Avery", householdId: "home-1" } };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ session })));

    await expect(fetchDashboardSession()).resolves.toEqual(session);
    expect(fetch).toHaveBeenCalledWith("/api/auth/session", { credentials: "same-origin" });
  });

  it("preserves an empty household as a truthful empty list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ children: [] })));
    await expect(fetchHouseholdChildren()).resolves.toEqual([]);
  });

  it("requests attempts for the selected child", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ attempts: [] })));
    await fetchDashboardAttempts("child/a");
    expect(fetch).toHaveBeenCalledWith("/api/children/child%2Fa/attempts", { credentials: "same-origin" });
  });

  it("requests routines for an explicit date", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ routines: [], date: "2026-10-03" })));
    await fetchDashboardRoutines("child-1", "2026-10-03");
    expect(fetch).toHaveBeenCalledWith("/api/children/child-1/routines?date=2026-10-03", { credentials: "same-origin" });
  });

  it("surfaces the API error contract instead of falling back to mock data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    )));
    await expect(fetchHouseholdChildren()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  });

  it("formats local dates without a UTC day shift", () => {
    expect(localDateKey(new Date(2026, 9, 3, 23, 30))).toBe("2026-10-03");
  });

  it("fetches child progress accurately", async () => {
    const progress = {
      childId: "child-1",
      lessonsCompleted: 2,
      totalLessons: 10,
      practiceTimeMinutes: 25,
    };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ progress })));
    await expect(fetchDashboardProgress("child-1")).resolves.toEqual(progress);
    expect(fetch).toHaveBeenCalledWith("/api/children/child-1/progress", { credentials: "same-origin" });
  });

  it("fetches lessons catalog", async () => {
    const lessons = [
      { id: "lesson-1", title: "Count with Penguins", subject: "Math" },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ lessons })));
    await expect(fetchDashboardLessons()).resolves.toEqual(lessons);
    expect(fetch).toHaveBeenCalledWith("/api/lessons", { credentials: "same-origin" });
  });

  it("fetches alerts for child and household", async () => {
    const alerts = [
      { id: "alert-1", childId: "child-1", title: "Safety alert", severity: "high", createdAt: "2026-10-03" },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ alerts })));
    await expect(fetchDashboardAlerts("child-1")).resolves.toEqual(alerts);
    expect(fetch).toHaveBeenCalledWith("/api/alerts?childId=child-1", { credentials: "same-origin" });

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ alerts })));
    await expect(fetchDashboardAlerts()).resolves.toEqual(alerts);
    expect(fetch).toHaveBeenCalledWith("/api/alerts", { credentials: "same-origin" });
  });

  it("creates a child in the household with POST request", async () => {
    const newChild = {
      id: "child-2",
      name: "Harper",
      age: 6,
      grade: "1st Grade",
      avatarUrl: null,
      isActive: true,
    };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ child: newChild }, { status: 201 })));
    const res = await createHouseholdChild({ name: "Harper", pin: "1234", age: 6, grade: "1st Grade" });
    expect(res).toEqual(newChild);
    expect(fetch).toHaveBeenCalledWith(
      "/api/children",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ name: "Harper", pin: "1234", age: 6, grade: "1st Grade" }),
      }),
    );
  });

  it("marks a safety alert as reviewed", async () => {
    const updated = { id: "alert-1", childId: "child-1", title: "Review", description: "Check in", severity: "high", createdAt: "2026-10-03", readAt: "2026-10-03T12:00:00Z" };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(updated)));
    await expect(markDashboardAlertRead("alert-1")).resolves.toEqual(updated);
    expect(fetch).toHaveBeenCalledWith("/api/alerts/alert-1", {
      credentials: "same-origin",
      method: "PATCH",
    });
  });

  it("formats error messages accurately", () => {
    expect(getErrorMessage(new Error("Network failed"))).toBe("Network failed");
    expect(getErrorMessage("String error")).toBe("Something went wrong while loading this page.");
  });
});
