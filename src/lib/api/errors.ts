import { NextResponse } from 'next/server';
import { t, tUnchecked } from '@/i18n';

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

// ── Presentation-layer Localization Helper ────────────────────────────────────

/** Known stable machine codes mapped to common.json apiErrors keys */
const CODE_TO_CATALOG_KEY: Record<string, string> = {
  VALIDATION_FAILED: 'apiErrors.VALIDATION_FAILED',
  INVALID_CREDENTIALS: 'apiErrors.INVALID_CREDENTIALS',
  UNAUTHORIZED: 'apiErrors.UNAUTHORIZED',
  PARENT_SESSION_REQUIRED: 'apiErrors.PARENT_SESSION_REQUIRED',
  FORBIDDEN: 'apiErrors.FORBIDDEN',
  NOT_FOUND: 'apiErrors.NOT_FOUND',
  CONFLICT: 'apiErrors.CONFLICT',
  PROVIDER_UNAVAILABLE: 'apiErrors.PROVIDER_UNAVAILABLE',
  PROVIDER_ERROR: 'apiErrors.PROVIDER_ERROR',
  PROVIDER_UNSAFE_OUTPUT: 'apiErrors.PROVIDER_UNSAFE_OUTPUT',
  REAUTH_REQUIRED: 'apiErrors.REAUTH_REQUIRED',
  INVALID_PASSWORD: 'apiErrors.INVALID_PASSWORD',
  CAPABILITY_UNAVAILABLE: 'apiErrors.CAPABILITY_UNAVAILABLE',
  PREFERENCE_UNAVAILABLE: 'apiErrors.PREFERENCE_UNAVAILABLE',
  WORKER_UNAVAILABLE: 'apiErrors.WORKER_UNAVAILABLE',
  INTERNAL: 'apiErrors.INTERNAL',
};

const STATUS_TO_CATALOG_KEY: Record<number, string> = {
  400: 'apiErrors.VALIDATION_FAILED',
  401: 'apiErrors.UNAUTHORIZED',
  403: 'apiErrors.FORBIDDEN',
  404: 'apiErrors.NOT_FOUND',
  409: 'apiErrors.CONFLICT',
  500: 'apiErrors.INTERNAL',
  502: 'apiErrors.PROVIDER_ERROR',
  503: 'apiErrors.PROVIDER_UNAVAILABLE',
};

/**
 * Extracts or maps an unknown error to a localized Vietnamese catalog string.
 * Strictly preserves machine error codes, HTTP statuses, and backend contracts.
 * Unknown errors and raw strings fail closed to a safe Vietnamese fallback.
 */
export function getLocalizedErrorMessage(
  error: unknown,
  fallbackNamespaceKey?: { namespace: 'common' | 'companion' | 'learning' | 'parent'; key: string },
): string {
  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    const code = typeof errObj.code === 'string' ? errObj.code : undefined;
    const status = typeof errObj.status === 'number'
      ? errObj.status
      : typeof errObj.statusCode === 'number'
      ? errObj.statusCode
      : undefined;

    if (code && CODE_TO_CATALOG_KEY[code]) {
      return tUnchecked('common', CODE_TO_CATALOG_KEY[code]);
    }

    if (status && STATUS_TO_CATALOG_KEY[status]) {
      return tUnchecked('common', STATUS_TO_CATALOG_KEY[status]);
    }
  }

  if (fallbackNamespaceKey) {
    return tUnchecked(fallbackNamespaceKey.namespace, fallbackNamespaceKey.key);
  }

  return t('common', 'apiErrors.generic');
}
