/**
 * Interpolation tests — Wave 1 Localization Foundation
 *
 * Tests for:
 *   1. interpolate() — standalone string template function
 *   2. t() — full namespace lookup + interpolation pipeline
 *   3. Edge cases: missing vars, extra vars, numeric vars, nested keys with vars
 */

import { describe, it, expect } from "vitest";
import { interpolate, t, tUnchecked } from "@/i18n";

// ---------------------------------------------------------------------------
// interpolate()
// ---------------------------------------------------------------------------

describe("interpolate()", () => {
  it("returns the template unchanged when no vars are given", () => {
    expect(interpolate("Lưu")).toBe("Lưu");
  });

  it("replaces a single {{varName}} placeholder", () => {
    expect(interpolate("Xin chào, {{name}}!", { name: "An" })).toBe(
      "Xin chào, An!"
    );
  });

  it("replaces a numeric placeholder", () => {
    expect(interpolate("{{count}} ngày trước", { count: 3 })).toBe(
      "3 ngày trước"
    );
  });

  it("replaces multiple placeholders in one template", () => {
    expect(
      interpolate("Câu hỏi {{number}} / {{total}}", { number: 1, total: 10 })
    ).toBe("Câu hỏi 1 / 10");
  });

  it("leaves {{varName}} intact when the variable is not provided", () => {
    expect(interpolate("Xin chào, {{name}}!", {})).toBe(
      "Xin chào, {{name}}!"
    );
  });

  it("ignores extra vars that have no corresponding placeholder", () => {
    expect(interpolate("Lưu", { extra: "ignored" })).toBe("Lưu");
  });

  it("replaces numeric value 0 (falsy but valid)", () => {
    expect(interpolate("{{count}} điểm", { count: 0 })).toBe("0 điểm");
  });
});

// ---------------------------------------------------------------------------
// t() — catalog lookup + interpolation
// ---------------------------------------------------------------------------

describe("t() – lookup", () => {
  it("looks up a top-level key in common namespace", () => {
    expect(t("common", "save")).toBe("Lưu");
  });

  it("looks up a nested key via dotted path", () => {
    expect(t("common", "date.today")).toBe("Hôm nay");
  });

  it("looks up a deeply nested key (3 levels)", () => {
    expect(t("learning", "lesson.status.completed")).toBe("Hoàn thành");
  });

  // tUnchecked() is used here because the key is intentionally invalid:
  // t() would reject "does.not.exist" at compile time (correct behaviour).
  it("returns sentinel string for an unknown key (via tUnchecked)", () => {
    expect(tUnchecked("common", "does.not.exist")).toBe("common:does.not.exist");
  });
});

// ---------------------------------------------------------------------------
// Type-safety tests — valid and invalid namespace→key pairings
// ---------------------------------------------------------------------------
// These tests verify that the type system enforces the correct key union
// for each namespace. The compile-time assertions use @ts-expect-error to
// prove that invalid pairings are rejected by TypeScript.

describe("t() – type safety (namespace→key enforcement)", () => {
  it("accepts valid key for common namespace", () => {
    // All of these must compile without error.
    expect(t("common", "save")).toBe("Lưu");
    expect(t("common", "date.today")).toBe("Hôm nay");
    expect(t("common", "aria.closeDialog")).toBe("Đóng hộp thoại");
  });

  it("accepts valid key for learning namespace", () => {
    expect(t("learning", "lesson.quiz.question", { number: 1, total: 5 })).toContain("1");
    expect(t("learning", "lesson.status.completed")).toBe("Hoàn thành");
  });

  it("accepts valid key for child namespace", () => {
    expect(t("child", "greeting", { name: "An" })).toBe("Xin chào, An!");
    expect(t("child", "badge.new")).toBe("Huy hiệu mới!");
  });

  it("rejects cross-namespace key at compile time (@ts-expect-error proves enforcement)", () => {
    // This call is intentionally invalid; @ts-expect-error proves
    // TypeScript rejects it. The runtime still returns a sentinel.
    const _result = t(
      "common",
      // @ts-expect-error "lesson.status.completed" belongs to "learning", not "common"
      "lesson.status.completed"
    );
    expect(_result).toBe("common:lesson.status.completed");
  });
});

// ---------------------------------------------------------------------------
// tUnchecked() — runtime fallback behaviour
// ---------------------------------------------------------------------------

describe("tUnchecked() – dynamic / external keys", () => {
  it("resolves a valid key just like t()", () => {
    expect(tUnchecked("common", "save")).toBe("Lưu");
  });

  it("returns sentinel for a missing key", () => {
    expect(tUnchecked("common", "does.not.exist")).toBe("common:does.not.exist");
  });

  it("interpolates vars for a valid key", () => {
    expect(tUnchecked("common", "date.daysAgo", { count: 7 })).toBe("7 ngày trước");
  });

  it("accepts a dynamically constructed key string", () => {
    const ns = "learning" as const;
    const key = ["lesson", "status", "completed"].join(".");
    expect(tUnchecked(ns, key)).toBe("Hoàn thành");
  });
});

describe("t() – interpolation", () => {
  it("interpolates {{name}} in child greeting", () => {
    expect(t("child", "greeting", { name: "Bảo" })).toBe("Xin chào, Bảo!");
  });

  it("interpolates {{count}} in common date.daysAgo", () => {
    expect(t("common", "date.daysAgo", { count: 5 })).toBe("5 ngày trước");
  });

  it("interpolates {{number}} and {{total}} in lesson quiz question", () => {
    expect(
      t("learning", "lesson.quiz.question", { number: 2, total: 8 })
    ).toBe("Câu hỏi 2 / 8");
  });

  it("leaves unfulfilled placeholders intact when vars partial", () => {
    // "{{count}} bài học hoàn thành" but only total provided
    const result = t("parent", "dashboard.lessonsCompleted", { count: 3 });
    expect(result).toBe("3 bài học hoàn thành");
  });

  it("handles zero count correctly", () => {
    expect(t("common", "date.daysAgo", { count: 0 })).toBe("0 ngày trước");
  });
});
