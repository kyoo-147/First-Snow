/**
 * Validates and sanitizes a callbackUrl redirect parameter.
 * Ensures the target is a safe same-origin path starting with exactly one slash,
 * rejecting protocol-relative URLs (e.g. //evil.com), backslash tricks (/\evil.com),
 * and absolute URI schemes (http:, https:, javascript:, data:).
 */
export function sanitizeCallbackUrl(
  url: string | null | undefined,
  fallback = "/parent",
): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Reject empty string or strings with control characters
  if (!trimmed || /[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  // Reject protocol-relative or backslash-based paths: //..., /\..., /\\...
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("/\\\\")) {
    return fallback;
  }

  // Check if there is any URL scheme inside (e.g., /https://... or javascript:)
  // Specifically check for standard URI schemes before any query or fragment
  const pathPart = trimmed.split("?")[0].split("#")[0];
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(pathPart.slice(1))) {
    return fallback;
  }

  return trimmed;
}
