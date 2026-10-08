/**
 * Wave 1 Localization Foundation – Catalog Loader
 *
 * Loads Vietnamese JSON catalogs per namespace.
 * This module is pure — no browser globals, no async I/O at runtime.
 * Catalogs are statically bundled via import() so they work in
 * Server Components, Client Components, and Node.js test environments.
 *
 * DESIGN INVARIANT (Wave 1)
 * There is exactly one locale (vi). The `locale` parameter is accepted
 * on every function so that later lanes can expand the set without
 * breaking the import API. Passing any locale other than "vi" in Wave 1
 * falls through to "vi" (safe-fallback — documented below).
 */

import type { Locale, Namespace } from "./types";

// ---------------------------------------------------------------------------
// Catalog map — keyed by Namespace, value is a nested JSON object.
// Using `Record<string, unknown>` allows deep traversal without `any`.
// ---------------------------------------------------------------------------
export type CatalogObject = Record<string, unknown>;
export type CatalogMap = Record<Namespace, CatalogObject>;

// ---------------------------------------------------------------------------
// Static imports — bundler-friendly, no dynamic path construction.
// ---------------------------------------------------------------------------
import commonVi from "./locales/vi/common.json";
import authVi from "./locales/vi/auth.json";
import childVi from "./locales/vi/child.json";
import parentVi from "./locales/vi/parent.json";
import learningVi from "./locales/vi/learning.json";
import companionVi from "./locales/vi/companion.json";

const CATALOGS_VI: CatalogMap = {
  common: commonVi as CatalogObject,
  auth: authVi as CatalogObject,
  child: childVi as CatalogObject,
  parent: parentVi as CatalogObject,
  learning: learningVi as CatalogObject,
  companion: companionVi as CatalogObject,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the full catalog map for the given locale.
 * Wave 1 only supports "vi"; any other value falls back to "vi" with a
 * console.warn in development so future lanes can detect missing catalogs.
 */
export function getCatalogMap(locale: Locale = "vi"): CatalogMap {
  if (locale !== "vi") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[i18n] Locale "${locale}" has no catalog in Wave 1. Falling back to "vi".`
      );
    }
  }
  return CATALOGS_VI;
}

/**
 * Returns the catalog object for a single namespace.
 * Throws at development time if the namespace is not registered
 * (hard fail so missing catalog entries surface during CI, not prod).
 */
export function getNamespaceCatalog(
  namespace: Namespace,
  locale: Locale = "vi"
): CatalogObject {
  const map = getCatalogMap(locale);
  const catalog = map[namespace];
  if (!catalog && process.env.NODE_ENV !== "production") {
    throw new Error(
      `[i18n] Namespace "${namespace}" is not registered in the catalog.`
    );
  }
  return catalog ?? {};
}

/**
 * Looks up a dotted key inside a catalog object and returns the
 * raw value (string) or undefined if not found.
 *
 * @example lookupKey(catalog, "date.today") // → "Hôm nay"
 */
export function lookupKey(
  catalog: CatalogObject,
  dottedKey: string
): string | undefined {
  const parts = dottedKey.split(".");
  let node: unknown = catalog;
  for (const part of parts) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}
