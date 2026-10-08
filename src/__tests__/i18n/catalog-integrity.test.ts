/**
 * Catalog integrity tests — Wave 1 Localization Foundation
 *
 * Verifies that:
 *   1. Every registered namespace is present and non-empty.
 *   2. All top-level keys in each namespace are non-empty strings or objects.
 *   3. No string value is left as an empty string (would silently hide text).
 *   4. getCatalogMap("vi") never throws.
 *   5. getNamespaceCatalog works for every namespace.
 *   6. lookupKey resolves deeply-nested dotted paths correctly.
 */

import { describe, it, expect } from "vitest";
import { getCatalogMap, getNamespaceCatalog, lookupKey } from "@/i18n/catalog";
import type { Namespace } from "@/i18n/types";

const NAMESPACES: Namespace[] = [
  "common",
  "auth",
  "child",
  "parent",
  "learning",
  "companion",
];

// ---------------------------------------------------------------------------
// Helper — collect every leaf (string) value in a nested object
// ---------------------------------------------------------------------------
function collectLeaves(obj: unknown, path = ""): Array<{ path: string; value: string }> {
  if (typeof obj === "string") {
    return [{ path, value: obj }];
  }
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      collectLeaves(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("catalog integrity – vi locale", () => {
  it("getCatalogMap does not throw for locale=vi", () => {
    expect(() => getCatalogMap("vi")).not.toThrow();
  });

  it("catalog map contains exactly the registered namespaces", () => {
    const map = getCatalogMap("vi");
    const keys = Object.keys(map).sort();
    expect(keys).toEqual([...NAMESPACES].sort());
  });

  for (const ns of NAMESPACES) {
    it(`namespace "${ns}" is a non-empty object`, () => {
      const catalog = getNamespaceCatalog(ns, "vi");
      expect(typeof catalog).toBe("object");
      expect(catalog).not.toBeNull();
      expect(Object.keys(catalog).length).toBeGreaterThan(0);
    });

    it(`namespace "${ns}" has no empty-string leaf values`, () => {
      const catalog = getNamespaceCatalog(ns, "vi");
      const leaves = collectLeaves(catalog);
      const empty = leaves.filter((l) => l.value.trim() === "");
      expect(empty).toEqual([]);
    });
  }
});

describe("lookupKey – dotted path resolution", () => {
  it("resolves a top-level key", () => {
    const catalog = getNamespaceCatalog("common", "vi");
    expect(lookupKey(catalog, "save")).toBe("Lưu");
  });

  it("resolves a nested dotted key", () => {
    const catalog = getNamespaceCatalog("common", "vi");
    expect(lookupKey(catalog, "date.today")).toBe("Hôm nay");
  });

  it("resolves a deeply nested key (3 levels)", () => {
    const catalog = getNamespaceCatalog("learning", "vi");
    expect(lookupKey(catalog, "lesson.status.completed")).toBe("Hoàn thành");
  });

  it("returns undefined for a missing key", () => {
    const catalog = getNamespaceCatalog("common", "vi");
    expect(lookupKey(catalog, "nonexistent.key.deep")).toBeUndefined();
  });

  it("returns undefined for a key that points to an object, not a string", () => {
    const catalog = getNamespaceCatalog("common", "vi");
    // "date" is an object, not a string leaf
    expect(lookupKey(catalog, "date")).toBeUndefined();
  });
});
