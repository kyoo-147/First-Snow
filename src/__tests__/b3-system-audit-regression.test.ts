import { describe, expect, it } from 'vitest';
import { checkSafety } from '@/server/companion/contracts';
import { normalizeE164 } from '@/server/safety/twilio';
import { CompanionTelemetryCollector } from '@/server/companion/telemetry';

describe('B3 System Audit Regression Tests', () => {
  describe('checkSafety robust input handling & Vietnamese detection', () => {
    it('handles null, undefined, empty, and whitespace strings without throwing', () => {
      expect(checkSafety(null)).toEqual({ flagged: false, reason: null, codes: [] });
      expect(checkSafety(undefined)).toEqual({ flagged: false, reason: null, codes: [] });
      expect(checkSafety('')).toEqual({ flagged: false, reason: null, codes: [] });
      expect(checkSafety('   \n\t  ')).toEqual({ flagged: false, reason: null, codes: [] });
    });

    it('correctly flags Vietnamese crisis phrases', () => {
      const suicideCheck = checkSafety('em đang buồn và muốn chết');
      expect(suicideCheck.flagged).toBe(true);
      expect(suicideCheck.codes).toContain('self_harm');

      const dangerCheck = checkSafety('cứu con với có người lạ vào nhà');
      expect(dangerCheck.flagged).toBe(true);
      expect(dangerCheck.codes).toContain('immediate_danger');

      const abuseCheck = checkSafety('em bị bạo hành và đánh đập');
      expect(abuseCheck.flagged).toBe(true);
      expect(abuseCheck.codes).toContain('abuse_disclosure');
    });

    it('does not flag benign conversational text', () => {
      const safe = checkSafety('Hôm nay con được điểm 10 môn Toán, vui quá!');
      expect(safe.flagged).toBe(false);
      expect(safe.codes).toEqual([]);
    });
  });

  describe('normalizeE164 edge cases', () => {
    it('safely handles non-string, null, or undefined values without throwing', () => {
      expect(normalizeE164(undefined)).toBeNull();
      expect(normalizeE164(null)).toBeNull();
      expect(normalizeE164('')).toBeNull();
      // @ts-expect-error testing runtime safety
      expect(normalizeE164(123456789)).toBeNull();
    });

    it('normalizes standard 10-digit Vietnamese numbers', () => {
      expect(normalizeE164('0901234567')).toBe('+84901234567');
      expect(normalizeE164('0912-345-678')).toBe('+84912345678');
      expect(normalizeE164('(098) 765 4321')).toBe('+84987654321');
    });

    it('validates already-formatted E.164 numbers', () => {
      expect(normalizeE164('+84901234567')).toBe('+84901234567');
      expect(normalizeE164('+12025550123')).toBe('+12025550123');
    });
  });

  describe('Companion telemetry privacy guarantee', () => {
    it('emits strictly redacted timing summaries without user text or secrets', () => {
      const collector = new CompanionTelemetryCollector();
      collector.recordPhase('ui_input', performance.now() - 5, 'ok');
      collector.recordPhase('safety_precheck', performance.now() - 3, 'ok');
      const summary = collector.flush();

      expect(summary.correlationId).toBeDefined();
      expect(summary.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(summary.outcome).toBe('ok');
      expect(summary.phases).toHaveLength(2);
      expect(summary.phases[0].phase).toBe('ui_input');
      expect(summary.phases[1].phase).toBe('safety_precheck');

      // Assert no sensitive PII fields exist
      const serialized = JSON.stringify(summary);
      expect(serialized).not.toContain('text');
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('content');
      expect(serialized).not.toContain('token');
    });
  });
});
