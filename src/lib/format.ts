/**
 * src/lib/format.ts — Centralized date/time/number formatting
 *
 * Wave 1 localization: All formatters now use the vi-VN locale.
 *
 * TIMEZONE SEMANTICS (preserved from original)
 * Intl.DateTimeFormat without a `timeZone` option uses the *runtime's*
 * local timezone — whatever the host OS is configured to use. On most
 * Vietnamese users' devices this is Asia/Ho_Chi_Minh, so timestamps will
 * naturally appear in the user's local time. Do NOT add timeZone: "UTC"
 * here without reviewing every call site first.
 *
 * USAGE
 *   import { formatSnowDateTime, formatSnowDate, formatSnowTime } from "@/lib/format";
 *
 * These are pure functions with no React dependency; they are safe to call
 * from Server Components, Client Components, and Node.js utilities alike.
 */

// vi-VN date-time: e.g. "8/10/2026, 14:05"
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// vi-VN date: e.g. "8/10/2026"
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

// vi-VN time: e.g. "14:05"
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatSnowDateTime(value: string | number | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatSnowDate(value: string | number | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatSnowTime(value: string | number | Date): string {
  return timeFormatter.format(new Date(value));
}
