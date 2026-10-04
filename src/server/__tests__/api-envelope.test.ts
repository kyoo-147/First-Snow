import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  ChildAttemptsResponseSchema,
  ChildProgressResponseSchema,
  CreateLessonAttemptSchema,
  LessonAttemptResponseSchema,
  LessonsListResponseSchema,
  SaveLessonAnswerSchema,
} from '@/server/contracts/learning';
import {
  ConsentsResponseSchema,
  PrivacySettingsResponseSchema,
  UpdatePrivacySettingsSchema,
} from '@/server/contracts/privacy';

const dbState = vi.hoisted(() => ({ rows: [] as unknown[][], shouldThrow: false }));

type Query = {
  from: () => Query;
  innerJoin: () => Query;
  where: () => Query;
  orderBy: () => Query;
  limit: () => Promise<unknown>;
  then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
};

vi.mock('@/db/client', () => {
  const query = () => {
    const q = {} as Query;
    q.from = () => q;
    q.innerJoin = () => q;
    q.where = () => q;
    q.orderBy = () => q;
    q.limit = () => run();
    q.then = (resolve, reject) => run().then(resolve, reject);
    return q;
  };
  return { db: { select: () => query() } };
});

function run(): Promise<unknown> {
  if (dbState.shouldThrow) return Promise.reject(new Error('database unavailable'));
  return Promise.resolve(dbState.rows.shift() ?? []);
}

vi.mock('@/server/auth', () => ({
  requireParentSession: async () => ({ sub: 'parent-1', role: 'parent', actorType: 'parent' }),
  getParentHousehold: async () => ({ id: 'house-1', ownerId: 'parent-1', name: 'Home' }),
  assertChildBelongsToHousehold: async () => null,
}));

const childId = '11111111-1111-4111-8111-111111111111';
const alertMessage = {
  id: '22222222-2222-4222-8222-222222222222',
  sessionId: '33333333-3333-4333-8333-333333333333',
  childId,
  clientMessageId: 'client-1',
  speaker: 'child',
  text: 'hello',
  isFlagged: true,
  flagReason: 'review',
  safetyScore: 50,
  safetyAlerts: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

beforeEach(() => {
  dbState.rows = [];
  dbState.shouldThrow = false;
});

describe('alerts GET envelope', () => {
  it('wraps household alerts in { alerts: [...] }', async () => {
    dbState.rows = [[{ message: alertMessage }]];
    const { GET } = await import('@/app/api/alerts/route');
    const response = await GET(new NextRequest('http://localhost/api/alerts'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { alerts: unknown[] };
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(body.alerts).toHaveLength(1);
    expect(body.alerts[0]).toMatchObject({ id: alertMessage.id, childId });
  });

  it('reports database failures without inventing data', async () => {
    dbState.shouldThrow = true;
    const { GET } = await import('@/app/api/alerts/route');
    const response = await GET(new NextRequest('http://localhost/api/alerts'));
    expect(response.status).toBe(500);
  });
});

describe('transcripts GET envelope', () => {
  it('wraps child transcripts in { transcripts: [...] }', async () => {
    dbState.rows = [
      [{ id: childId, householdId: 'house-1', isActive: true }],
      [{ id: '44444444-4444-4444-8444-444444444444', sessionId: 'minh', speaker: 'snow', text: 'hi', createdAt: new Date('2026-01-01T00:00:00Z') }],
    ];
    const { GET } = await import('@/app/api/children/[childId]/transcripts/route');
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ childId }) });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { transcripts: unknown[] };
    expect(Array.isArray(body.transcripts)).toBe(true);
    expect(body.transcripts).toHaveLength(1);
    expect(body.transcripts[0]).toMatchObject({ id: '44444444-4444-4444-8444-444444444444', sessionId: 'minh' });
  });
});

describe('shared contracts', () => {
  it('validates privacy request and response shapes', () => {
    expect(UpdatePrivacySettingsSchema.safeParse({ cameraAccess: true, transcriptStorageDays: 30 }).success).toBe(true);
    expect(UpdatePrivacySettingsSchema.safeParse({ cameraPreview: true, unexpected: 1 }).success).toBe(false);
    expect(PrivacySettingsResponseSchema.safeParse({
      privacy: {
        microphoneAccess: false,
        cameraAccess: false,
        visionAiAccess: false,
        screenCaptureAccess: false,
        cameraPreview: false,
        transcriptStorageDays: 30,
        emotionTimelineStorage: false,
      },
    }).success).toBe(true);
  });

  it('validates consent response shapes', () => {
    const parsed = ConsentsResponseSchema.safeParse({
      consents: [{ id: '55555555-5555-4555-8555-555555555555', scope: 'microphone', status: 'granted', granted: true, policyVersion: '1.0' }],
      summary: { microphone: true, camera: false, vision: false, screen: false },
      policyVersion: '1.0',
    });
    expect(parsed.success).toBe(true);
  });

  it('validates learning request and response shapes', () => {
    expect(CreateLessonAttemptSchema.safeParse({ lessonId: '66666666-6666-4666-8666-666666666666' }).success).toBe(true);
    expect(CreateLessonAttemptSchema.safeParse({ lessonId: 'not-a-uuid' }).success).toBe(false);
    expect(SaveLessonAnswerSchema.safeParse({ stepId: '66666666-6666-4666-8666-666666666666', answer: { id: 'a' } }).success).toBe(true);
    expect(LessonsListResponseSchema.safeParse({ lessons: [{ id: '66666666-6666-4666-8666-666666666666', title: 'Lesson', subject: 'Math' }] }).success).toBe(true);
    expect(LessonAttemptResponseSchema.safeParse({ attempt: { id: '66666666-6666-4666-8666-666666666666', childId, lessonId: '77777777-7777-4777-8777-777777777777', status: 'in_progress' } }).success).toBe(true);
    expect(ChildProgressResponseSchema.safeParse({ progress: { childId, skills: [{ label: 'Reading', value: 3 }] } }).success).toBe(true);
    expect(ChildAttemptsResponseSchema.safeParse({ attempts: [{ id: '88888888-8888-4888-8888-888888888888', lessonId: '77777777-7777-4777-8777-777777777777', status: 'completed' }] }).success).toBe(true);
  });
});
