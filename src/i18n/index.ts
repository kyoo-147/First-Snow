/**
 * Wave 1 Localization Foundation – Public API
 *
 * Usage (Server Component, Client Component, or Node utility — all safe):
 *
 *   import { t } from "@/i18n";
 *
 *   // Simple key lookup (compile-time key validation)
 *   t("common", "save")                   // → "Lưu"
 *   t("common", "date.today")             // → "Hôm nay"
 *
 *   // Interpolation with named placeholders
 *   t("child", "greeting", { name: "An" })           // → "Xin chào, An!"
 *   t("common", "date.daysAgo", { count: 3 })         // → "3 ngày trước"
 *   t("learning", "lesson.quiz.question", { number: 1, total: 10 })
 *
 *   // For dynamic / external keys not known at compile time use tUnchecked():
 *   tUnchecked("common", someExternalKey)  // runtime-only fallback, no TS guard
 *
 * DESIGN
 * ------
 * • Pure functions — no side effects, no module-level mutable state.
 * • Safe in any render environment (server, client, edge, Node tests).
 * • Catalog is statically bundled — no fetch, no fs.readFile.
 * • Wave 1 is Vietnamese-only; locale param is wired through so
 *   later lanes add locales without breaking the call sites.
 * • Interpolation uses {{varName}} syntax matching the catalog convention.
 *
 * BOUNDARY WITH VTUBER SUBSYSTEM
 * --------------------------------
 * Do NOT import from "i18next" or "react-i18next" here.
 * Those belong exclusively to src/vtuber-app/src/i18n.ts.
 * See docs/localization/MANIFEST.md §Boundary.
 */

export type { Locale, Namespace, InterpolationVars, CatalogForNamespace, NamespaceKey } from "./types";
export { DEFAULT_LOCALE, INTL_LOCALE } from "./types";
export { getCatalogMap, getNamespaceCatalog, lookupKey } from "./catalog";
export type { CatalogObject, CatalogMap } from "./catalog";

import type { Locale, Namespace, InterpolationVars, NamespaceKey } from "./types";
import { lookupKey, getNamespaceCatalog } from "./catalog";

// ---------------------------------------------------------------------------
// interpolate
// ---------------------------------------------------------------------------

/**
 * Replaces `{{varName}}` placeholders in a template string.
 *
 * @example
 *   interpolate("Xin chào, {{name}}!", { name: "An" }) // → "Xin chào, An!"
 *   interpolate("{{count}} ngày trước", { count: 3 })  // → "3 ngày trước"
 */
export function interpolate(
  template: string,
  vars: InterpolationVars = {}
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ---------------------------------------------------------------------------
// t — type-safe primary message lookup + interpolation
// ---------------------------------------------------------------------------

/**
 * Look up a message by namespace + **typed** dotted key and optionally
 * interpolate vars. The `key` parameter is constrained to the exact set of
 * dotted paths that exist in the chosen namespace's JSON catalog, so
 * misspelled or cross-namespace keys are caught at compile time.
 *
 * Returns the Vietnamese string on success.
 * Returns `namespace:key` as a fallback sentinel if the key is not found at
 * runtime (e.g. after a catalog update that has not been type-checked yet),
 * and emits a console.warn in non-production environments.
 *
 * @param namespace - One of the registered catalog namespaces.
 * @param key       - A valid dotted path for the selected namespace (type-checked).
 * @param vars      - Optional interpolation variables.
 * @param locale    - Locale to use (defaults to "vi"; Wave 1 only supports "vi").
 *
 * @see tUnchecked — use instead when `key` comes from external / dynamic input.
 */
export function t<N extends Namespace>(
  namespace: N,
  key: NamespaceKey<N>,
  vars?: InterpolationVars,
  locale: Locale = "vi"
): string {
  const catalog = getNamespaceCatalog(namespace, locale);
  const raw = lookupKey(catalog, key as string);

  if (raw === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing key: ${namespace}:${key}`);
    }
    return `${namespace}:${key}`;
  }

  return vars ? interpolate(raw, vars) : raw;
}

// ---------------------------------------------------------------------------
// tUnchecked — runtime fallback for external / dynamic keys
// ---------------------------------------------------------------------------

/**
 * Identical runtime behaviour to `t()` but accepts any `string` as the key,
 * bypassing the compile-time namespace→key constraint.
 *
 * Use this **only** for keys that cannot be known statically — for example,
 * keys read from a database field or constructed at runtime from user input.
 * For all static call sites, prefer `t()` so that invalid keys are caught
 * by TypeScript at compile time.
 *
 * @param namespace - One of the registered catalog namespaces.
 * @param key       - Any dotted key string (no compile-time validation).
 * @param vars      - Optional interpolation variables.
 * @param locale    - Locale to use (defaults to "vi").
 */
export function tUnchecked(
  namespace: Namespace,
  key: string,
  vars?: InterpolationVars,
  locale: Locale = "vi"
): string {
  const catalog = getNamespaceCatalog(namespace, locale);
  const raw = lookupKey(catalog, key);

  if (raw === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing key: ${namespace}:${key}`);
    }
    return `${namespace}:${key}`;
  }

  return vars ? interpolate(raw, vars) : raw;
}
