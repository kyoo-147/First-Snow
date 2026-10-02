import { NextResponse } from 'next/server';

export type ApiErrorDetails = Record<string, string[] | string>;

/**
 * Canonical nested error response expected by the auth UI:
 * { error: { code, message, details?, requestId? } }
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetails,
  requestId?: string,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    },
    { status },
  );
}

// ── Named constructors ────────────────────────────────────────────────────────

export const ERRORS = {
  validationFailed: (details?: ApiErrorDetails) =>
    apiError(400, 'VALIDATION_FAILED', 'Validation failed.', details),

  invalidCredentials: () =>
    apiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.'),

  unauthorized: (message = 'Authentication required.') =>
    apiError(401, 'UNAUTHORIZED', message),

  parentSessionRequired: () =>
    apiError(
      401,
      'PARENT_SESSION_REQUIRED',
      'A guardian must be signed in to authenticate a child.',
    ),

  forbidden: (message = 'Access denied.') =>
    apiError(403, 'FORBIDDEN', message),

  notFound: (message = 'Not found.') =>
    apiError(404, 'NOT_FOUND', message),

  conflict: (message = 'Resource already exists.') =>
    apiError(409, 'CONFLICT', message),

  internal: (message = 'Internal server error.') =>
    apiError(500, 'INTERNAL', message),
};
