/**
 * Wave 1 Localization Foundation – Type Definitions
 *
 * ARCHITECTURE NOTE
 * This module is pure TypeScript with no browser dependencies.
 * It is safe to import in Server Components, Client Components,
 * Route Handlers, and server utilities alike.
 *
 * BOUNDARY WITH VTUBER SUBSYSTEM
 * The VTuber i18next subsystem lives entirely within
 * src/vtuber-app/src/i18n.ts and its locales/. It uses
 * react-i18next + browser LanguageDetector and must NEVER be
 * merged into this layer. This layer is catalog-based and
 * server/client-safe; the VTuber layer is runtime-based and
 * browser-only. See docs/localization/MANIFEST.md for details.
 */

// ---------------------------------------------------------------------------
// Supported locales
// ---------------------------------------------------------------------------

/** All locales supported by the AgentKid main application.
 *  Wave 1: Vietnamese only. Later lanes add more entries here. */
export type Locale = "vi";

/** The default (and currently only) locale for the application. */
export const DEFAULT_LOCALE: Locale = "vi";

/** BCP-47 tag used for Intl APIs (e.g. Intl.DateTimeFormat). */
export const INTL_LOCALE = "vi-VN" as const;

// ---------------------------------------------------------------------------
// Namespace registry
// The catalog is split into domain namespaces to keep individual JSON
// files small and to make ownership clear for future contributors.
// ---------------------------------------------------------------------------

/** All defined namespace identifiers. */
export type Namespace =
  | "common"     // Shared UI chrome (buttons, labels, status)
  | "auth"       // Login, register, session, password reset
  | "child"      // Child-facing learning UI
  | "parent"     // Parent dashboard, monitoring, settings
  | "learning"   // Lesson catalog, progress, subjects
  | "companion"; // AI companion chat, voice, states

// ---------------------------------------------------------------------------
// Message key helper types
// ---------------------------------------------------------------------------

/** A dotted path into a deeply-nested JSON catalog object. */
export type DottedKey<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? DottedKey<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/** Interpolation variables — a plain record of string/number values. */
export type InterpolationVars = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Per-namespace catalog shape types
// ---------------------------------------------------------------------------
// These `import type` declarations pull the inferred JSON shape so that
// DottedKey<CatalogForNamespace[N]> produces the exact set of valid dotted
// keys for namespace N. resolveJsonModule must be true (it is).

import type commonShape from "./locales/vi/common.json";
import type authShape from "./locales/vi/auth.json";
import type childShape from "./locales/vi/child.json";
import type parentShape from "./locales/vi/parent.json";
import type learningShape from "./locales/vi/learning.json";
import type companionShape from "./locales/vi/companion.json";

/**
 * Maps each Namespace to the TypeScript type of its JSON catalog.
 * Extend this map when a new namespace is added (Wave 2+).
 */
export type CatalogForNamespace = {
  common: typeof commonShape;
  auth: typeof authShape;
  child: typeof childShape;
  parent: typeof parentShape;
  learning: typeof learningShape;
  companion: typeof companionShape;
};

/**
 * The union of all valid dotted keys for namespace N.
 * @example NamespaceKey<"common"> // "save" | "cancel" | "date.today" | …
 */
export type NamespaceKey<N extends Namespace> = DottedKey<CatalogForNamespace[N]>;
