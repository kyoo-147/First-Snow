import { describe, expect, it } from 'vitest';
import { ERRORS, getLocalizedErrorMessage } from '@/lib/api/errors';
import { t } from '@/i18n';

describe('API Error Localization & Presentation-Safe Boundary', () => {
  describe('Known machine error codes map to Vietnamese catalog strings', () => {
    it('maps VALIDATION_FAILED code to Vietnamese catalog copy', () => {
      const err = { code: 'VALIDATION_FAILED' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.VALIDATION_FAILED'));
      expect(localized).toBe('Thông tin cung cấp không hợp lệ. Vui lòng kiểm tra lại.');
    });

    it('maps INVALID_CREDENTIALS code to Vietnamese catalog copy', () => {
      const err = { code: 'INVALID_CREDENTIALS' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.INVALID_CREDENTIALS'));
      expect(localized).toBe('Thông tin xác thực không chính xác.');
    });

    it('maps UNAUTHORIZED code to Vietnamese catalog copy', () => {
      const err = { code: 'UNAUTHORIZED' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.UNAUTHORIZED'));
      expect(localized).toBe('Phiên làm việc đã hết hạn hoặc cần đăng nhập.');
    });

    it('maps PARENT_SESSION_REQUIRED code to Vietnamese catalog copy', () => {
      const err = { code: 'PARENT_SESSION_REQUIRED' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.PARENT_SESSION_REQUIRED'));
      expect(localized).toBe('Cần có phụ huynh đăng nhập để tiếp tục.');
    });

    it('maps FORBIDDEN code to Vietnamese catalog copy', () => {
      const err = { code: 'FORBIDDEN' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.FORBIDDEN'));
      expect(localized).toBe('Bạn không có quyền thực hiện thao tác này.');
    });

    it('maps NOT_FOUND code to Vietnamese catalog copy', () => {
      const err = { code: 'NOT_FOUND' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.NOT_FOUND'));
      expect(localized).toBe('Không tìm thấy tài nguyên yêu cầu.');
    });

    it('maps CONFLICT code to Vietnamese catalog copy', () => {
      const err = { code: 'CONFLICT' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.CONFLICT'));
      expect(localized).toBe('Dữ liệu bị xung đột hoặc đã tồn tại.');
    });

    it('maps PROVIDER_UNAVAILABLE code to Vietnamese catalog copy', () => {
      const err = { code: 'PROVIDER_UNAVAILABLE' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.PROVIDER_UNAVAILABLE'));
      expect(localized).toBe('Dịch vụ trợ lý tạm thời không khả dụng. Vui lòng thử lại sau.');
    });

    it('maps PROVIDER_ERROR code to Vietnamese catalog copy', () => {
      const err = { code: 'PROVIDER_ERROR' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.PROVIDER_ERROR'));
      expect(localized).toBe('Không nhận được phản hồi từ dịch vụ trợ lý. Vui lòng thử lại.');
    });

    it('maps PROVIDER_UNSAFE_OUTPUT code to Vietnamese catalog copy', () => {
      const err = { code: 'PROVIDER_UNSAFE_OUTPUT' };
      const localized = getLocalizedErrorMessage(err);
      expect(localized).toBe(t('common', 'apiErrors.PROVIDER_UNSAFE_OUTPUT'));
      expect(localized).toBe('Trợ lý không thể đưa ra phản hồi an toàn. Vui lòng thử câu hỏi khác.');
    });

    it('maps REAUTH_REQUIRED and INVALID_PASSWORD to Vietnamese catalog copy', () => {
      expect(getLocalizedErrorMessage({ code: 'REAUTH_REQUIRED' })).toBe(
        t('common', 'apiErrors.REAUTH_REQUIRED'),
      );
      expect(getLocalizedErrorMessage({ code: 'INVALID_PASSWORD' })).toBe(
        t('common', 'apiErrors.INVALID_PASSWORD'),
      );
    });

    it('maps capability, preference, worker and internal error codes', () => {
      expect(getLocalizedErrorMessage({ code: 'CAPABILITY_UNAVAILABLE' })).toBe(
        t('common', 'apiErrors.CAPABILITY_UNAVAILABLE'),
      );
      expect(getLocalizedErrorMessage({ code: 'PREFERENCE_UNAVAILABLE' })).toBe(
        t('common', 'apiErrors.PREFERENCE_UNAVAILABLE'),
      );
      expect(getLocalizedErrorMessage({ code: 'WORKER_UNAVAILABLE' })).toBe(
        t('common', 'apiErrors.WORKER_UNAVAILABLE'),
      );
      expect(getLocalizedErrorMessage({ code: 'INTERNAL' })).toBe(
        t('common', 'apiErrors.INTERNAL'),
      );
    });
  });

  describe('HTTP status codes map when code is absent', () => {
    it('maps status 400 to validation error copy', () => {
      expect(getLocalizedErrorMessage({ status: 400 })).toBe(t('common', 'apiErrors.VALIDATION_FAILED'));
    });

    it('maps status 401 to unauthorized copy', () => {
      expect(getLocalizedErrorMessage({ status: 401 })).toBe(t('common', 'apiErrors.UNAUTHORIZED'));
    });

    it('maps status 403 to forbidden copy', () => {
      expect(getLocalizedErrorMessage({ status: 403 })).toBe(t('common', 'apiErrors.FORBIDDEN'));
    });

    it('maps status 404 to not found copy', () => {
      expect(getLocalizedErrorMessage({ status: 404 })).toBe(t('common', 'apiErrors.NOT_FOUND'));
    });

    it('maps status 409 to conflict copy', () => {
      expect(getLocalizedErrorMessage({ status: 409 })).toBe(t('common', 'apiErrors.CONFLICT'));
    });

    it('maps status 500 to internal error copy', () => {
      expect(getLocalizedErrorMessage({ status: 500 })).toBe(t('common', 'apiErrors.INTERNAL'));
    });

    it('maps status 502 to provider error copy', () => {
      expect(getLocalizedErrorMessage({ status: 502 })).toBe(t('common', 'apiErrors.PROVIDER_ERROR'));
    });

    it('maps status 503 to provider unavailable copy', () => {
      expect(getLocalizedErrorMessage({ status: 503 })).toBe(t('common', 'apiErrors.PROVIDER_UNAVAILABLE'));
    });

    it('works with statusCode property (SafetyApiError pattern)', () => {
      expect(getLocalizedErrorMessage({ statusCode: 404 })).toBe(t('common', 'apiErrors.NOT_FOUND'));
    });
  });

  describe('Fail-closed handling for unknown errors and raw text', () => {
    it('unknown error object falls back to generic Vietnamese message', () => {
      const err = { message: 'Some technical SQL query error', code: 'UNKNOWN_DB_ERROR' };
      expect(getLocalizedErrorMessage(err)).toBe(t('common', 'apiErrors.generic'));
      expect(getLocalizedErrorMessage(err)).toBe('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    });

    it('raw Error instance with unknown message falls back to generic Vietnamese message', () => {
      const err = new Error('Database connection failed: ECONNREFUSED');
      expect(getLocalizedErrorMessage(err)).toBe(t('common', 'apiErrors.generic'));
    });

    it('raw string error falls back to generic Vietnamese message', () => {
      expect(getLocalizedErrorMessage('arbitrary server crash text')).toBe(t('common', 'apiErrors.generic'));
    });

    it('null or undefined falls back to generic Vietnamese message', () => {
      expect(getLocalizedErrorMessage(null)).toBe(t('common', 'apiErrors.generic'));
      expect(getLocalizedErrorMessage(undefined)).toBe(t('common', 'apiErrors.generic'));
    });

    it('respects optional custom fallback key', () => {
      const customFallback = getLocalizedErrorMessage(null, {
        namespace: 'companion',
        key: 'error.connectionFailed',
      });
      expect(customFallback).toBe('Không thể kết nối. Vui lòng kiểm tra mạng.');
    });
  });

  describe('Contract preservation invariants', () => {
    it('ERRORS object continues to produce exact English contract payloads for backend routes', async () => {
      const v = ERRORS.validationFailed({ name: ['Required'] });
      expect(v.status).toBe(400);
      const vJson = await v.json();
      expect(vJson).toEqual({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed.',
          details: { name: ['Required'] },
        },
      });

      const unauth = ERRORS.unauthorized();
      expect(unauth.status).toBe(401);
      const unauthJson = await unauth.json();
      expect(unauthJson).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });

      const parentReq = ERRORS.parentSessionRequired();
      expect(parentReq.status).toBe(401);
      const parentReqJson = await parentReq.json();
      expect(parentReqJson).toEqual({
        error: {
          code: 'PARENT_SESSION_REQUIRED',
          message: 'A guardian must be signed in to authenticate a child.',
        },
      });

      const forbidden = ERRORS.forbidden();
      expect(forbidden.status).toBe(403);
      const forbiddenJson = await forbidden.json();
      expect(forbiddenJson).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied.',
        },
      });

      const notFound = ERRORS.notFound();
      expect(notFound.status).toBe(404);
      const notFoundJson = await notFound.json();
      expect(notFoundJson).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Not found.',
        },
      });

      const conflict = ERRORS.conflict();
      expect(conflict.status).toBe(409);
      const conflictJson = await conflict.json();
      expect(conflictJson).toEqual({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists.',
        },
      });

      const internal = ERRORS.internal();
      expect(internal.status).toBe(500);
      const internalJson = await internal.json();
      expect(internalJson).toEqual({
        error: {
          code: 'INTERNAL',
          message: 'Internal server error.',
        },
      });
    });
  });
});
