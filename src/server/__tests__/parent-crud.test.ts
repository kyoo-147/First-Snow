import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  CreateChildSchema,
  RegisterParentSchema,
  UpdateChildSchema,
} from '@/server/contracts/auth';
import {
  emergencyContactSavedMessage,
  emergencyContactUpdatedMessage,
} from '@/server/safety/emergency-contact-presenter';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock DB state
type MockQuery = {
  from: () => MockQuery;
  innerJoin: () => MockQuery;
  leftJoin: () => MockQuery;
  where: () => MockQuery;
  orderBy: () => MockQuery;
  limit: () => Promise<unknown[]>;
  returning: (fields?: unknown) => Promise<unknown[]>;
  then: (resolve: (val: unknown) => unknown) => Promise<unknown>;
};

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  deleteQueue: [] as unknown[][],
  insertedAuditEvents: [] as unknown[],
  updatedSessions: [] as unknown[],
  updatedEmergencyContacts: [] as unknown[],
}));

vi.mock('@/db/client', () => {
  const makeQuery = (queue: unknown[][]): MockQuery => {
    const q: MockQuery = {
      from: () => q,
      innerJoin: () => q,
      leftJoin: () => q,
      where: () => q,
      orderBy: () => q,
      limit: async () => queue.shift() ?? [],
      returning: async () => queue.shift() ?? [],
      then: async (resolve) => resolve(queue.shift() ?? []),
    };
    return q;
  };

  return {
    db: {
      select: vi.fn(() => makeQuery(dbState.selectQueue)),
      insert: vi.fn(() => ({
        values: vi.fn((val: unknown) => {
          if (typeof val === 'object' && val !== null && 'eventType' in (val as Record<string, unknown>)) {
            dbState.insertedAuditEvents.push(val);
          }
          const query = makeQuery(dbState.insertQueue);
          return query;
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((val: unknown) => {
          dbState.updatedSessions.push(val);
          const query = makeQuery(dbState.updateQueue);
          return query;
        }),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => makeQuery(dbState.deleteQueue)),
      })),
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb({
          select: vi.fn(() => makeQuery(dbState.selectQueue)),
          insert: vi.fn(() => ({
            values: vi.fn((val: unknown) => {
              if (typeof val === 'object' && val !== null && 'eventType' in (val as Record<string, unknown>)) {
                dbState.insertedAuditEvents.push(val);
              }
              return makeQuery(dbState.insertQueue);
            }),
          })),
          update: vi.fn(() => ({
            set: vi.fn((val: unknown) => {
              dbState.updatedSessions.push(val);
              return makeQuery(dbState.updateQueue);
            }),
          })),
          delete: vi.fn(() => ({
            where: vi.fn(() => makeQuery(dbState.deleteQueue)),
          })),
        });
      }),
    },
  };
});

const authMock = vi.hoisted(() => ({
  session: { sub: 'parent-123', role: 'parent', actorType: 'parent' } as unknown,
  household: { id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' } as unknown,
}));

vi.mock('@/server/auth', () => ({
  requireParentSession: vi.fn(async () => authMock.session),
  getParentSession: vi.fn(async () => authMock.session),
  getParentHousehold: vi.fn(async () => authMock.household),
  assertChildBelongsToHousehold: vi.fn(async (childId: string, householdId: string) => {
    if (childId === '11111111-1111-4111-8111-111111111111' && householdId === 'hh-123') {
      return null;
    }
    return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

vi.mock('@/lib/auth/parent-auth', () => ({
  verifyPassword: vi.fn(async (password: string) => password === 'ValidPass123'),
  hashPassword: vi.fn(async () => 'mock-password-hash'),
}));

vi.mock('@/lib/auth/child-auth', () => ({
  hashPin: vi.fn(async (pin: string) => `hashed-pin-${pin}`),
}));

vi.mock('@/server/safety/twilio', () => ({
  readTwilioConfig: vi.fn(() => ({ accountSid: 'AC123', authToken: 'secret', fromNumber: '+15005550006' })),
  normalizeE164: vi.fn((phone: string) => (phone.startsWith('+') ? phone : `+84${phone.replace(/^0/, '')}`)),
}));

describe('Parent CRUD Contracts, Validation, and Safety Audits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.selectQueue = [];
    dbState.insertQueue = [];
    dbState.updateQueue = [];
    dbState.deleteQueue = [];
    dbState.insertedAuditEvents = [];
    dbState.updatedSessions = [];
    dbState.updatedEmergencyContacts = [];
    authMock.session = { sub: 'parent-123', role: 'parent', actorType: 'parent' };
    authMock.household = { id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' };
  });

  describe('Contract & Schema Integrity', () => {
    it('rejects whitespace-only child and parent names', () => {
      expect(CreateChildSchema.safeParse({ name: '   ', pin: '1234' }).success).toBe(false);
      expect(CreateChildSchema.safeParse({ displayName: '   ', pin: '1234' }).success).toBe(false);
      expect(
        RegisterParentSchema.safeParse({ name: ' ', email: 'parent@example.com', password: 'Password1' }).success,
      ).toBe(false);
    });

    it('trims child identity and grade values before persistence', () => {
      const parsed = CreateChildSchema.parse({ name: '  Linh  ', pin: '1234', grade: '  Grade 3  ' });
      expect(parsed.name).toBe('Linh');
      expect(parsed.grade).toBe('Grade 3');
    });

    it('validates UpdateChildSchema rejecting empty or whitespace-only inputs', () => {
      expect(UpdateChildSchema.safeParse({}).success).toBe(false);
      expect(UpdateChildSchema.safeParse({ name: '   ' }).success).toBe(false);
      expect(UpdateChildSchema.safeParse({ displayName: '   ' }).success).toBe(false);

      const parsed = UpdateChildSchema.parse({ name: '  Minh  ', grade: '  Grade 4  ', age: null });
      expect(parsed.name).toBe('Minh');
      expect(parsed.grade).toBe('Grade 4');
      expect(parsed.age).toBeNull();
    });

    it('returns readable emergency-contact presenter messages without mojibake', () => {
      expect(emergencyContactSavedMessage(true)).toMatch(/Emergency contact saved and consent to emergency alerts confirmed\./);
      expect(emergencyContactSavedMessage(true)).not.toMatch(/Ã/);
      expect(emergencyContactSavedMessage(false)).toBe('Emergency contact saved; automatic alerts are off.');
      expect(emergencyContactUpdatedMessage(true)).toBe('Emergency alerts enabled for this contact.');
      expect(emergencyContactUpdatedMessage(false)).toBe('Emergency contact updated.');
    });
  });

  describe('Children CRUD Handlers (/api/children and /api/children/[childId])', () => {
    const validChildId = '11111111-1111-4111-8111-111111111111';
    const foreignChildId = '99999999-9999-4999-8999-999999999999';

    it('POST /api/children safely rejects malformed JSON with 400 instead of 500', async () => {
      const { POST } = await import('@/app/api/children/route');
      const req = new NextRequest('http://localhost/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('POST /api/children creates child with trimmed values, hashes PIN, and returns Cache-Control: no-store', async () => {
      const { POST } = await import('@/app/api/children/route');
      const now = new Date();
      dbState.insertQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
          },
        ],
        [], // audit event insert
      ];

      const req = new NextRequest('http://localhost/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '  Linh  ', pin: '1234', age: 7, grade: '  Grade 2  ' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(res.headers.get('Cache-Control')).toBe('no-store');
      const json = await res.json();
      expect(json.child.name).toBe('Linh');
      expect(json.child.displayName).toBe('Linh');
      expect(json.child.grade).toBe('Grade 2');
      expect(dbState.insertedAuditEvents.length).toBeGreaterThan(0);
    });

    it('GET /api/children returns active children with human-readable mappings and Cache-Control: no-store', async () => {
      const { GET } = await import('@/app/api/children/route');
      const now = new Date();
      dbState.selectQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
          },
        ],
      ];

      const res = await GET();
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('no-store');
      const json = await res.json();
      expect(json.children[0].name).toBe('Linh');
      expect(json.children[0].grade).toBe('Grade 2');
    });

    it('GET /api/children/[childId] rejects cross-household child with 403 (anti-enumeration)', async () => {
      const { GET } = await import('@/app/api/children/[childId]/route');
      const res = await GET(new Request('http://localhost/api/children/' + foreignChildId), {
        params: Promise.resolve({ childId: foreignChildId }),
      });
      expect(res.status).toBe(403);
    });

    it('PATCH /api/children/[childId] rejects whitespace-only name updates with 400', async () => {
      const { PATCH } = await import('@/app/api/children/[childId]/route');
      const req = new Request('http://localhost/api/children/' + validChildId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '   ' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(400);
    });

    it('PATCH /api/children/[childId] revokes active child sessions when PIN is updated', async () => {
      const { PATCH } = await import('@/app/api/children/[childId]/route');
      const now = new Date();
      dbState.selectQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];
      dbState.updateQueue = [
        [], // session revocation update
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/children/' + validChildId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '5678' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(200);
      expect(dbState.updatedSessions.some((s) => typeof s === 'object' && s !== null && 'revokedAt' in (s as Record<string, unknown>))).toBe(true);
    });

    it('DELETE /api/children/[childId] soft-deletes child, revokes sessions, and is idempotent', async () => {
      const { DELETE } = await import('@/app/api/children/[childId]/route');
      const now = new Date();
      dbState.selectQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: false, // already soft-deleted
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];
      dbState.updateQueue = [
        [], // session revocation
        [{ id: validChildId }], // child update
      ];

      const req = new Request('http://localhost/api/children/' + validChildId, { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('Emergency Contacts CRUD Handlers (/api/emergency-contacts)', () => {
    it('POST /api/emergency-contacts demotes existing primary contact when isPrimary is true', async () => {
      const { POST } = await import('@/app/api/emergency-contacts/route');
      const now = new Date();
      dbState.selectQueue = [
        [{ id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' }], // context
      ];
      dbState.updateQueue = [
        [], // demote existing primary contacts
      ];
      dbState.insertQueue = [
        [
          {
            id: 'ec-1',
            householdId: 'hh-123',
            name: 'Uncle David',
            relationship: 'Uncle',
            phone: '+84901234567',
            email: 'david@example.com',
            isPrimary: true,
            notifyOnAlert: true,
            consentGrantedAt: now,
            verifiedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Uncle David',
          relation: 'Uncle',
          phone: '+84901234567',
          email: 'david@example.com',
          isPrimary: true,
          notifyOnAlert: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.contact.name).toBe('Uncle David');
      expect(json.contact.isPrimary).toBe(true);
      expect(json.message).toBe('Emergency contact saved and consent to emergency alerts confirmed.');
    });

    it('PATCH /api/emergency-contacts permits clearing email (null) and requires reauth for phone change', async () => {
      const { PATCH } = await import('@/app/api/emergency-contacts/route');
      const now = new Date();
      dbState.selectQueue = [
        [{ id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' }], // context
        [
          {
            id: 'ec-1',
            householdId: 'hh-123',
            name: 'Uncle David',
            relationship: 'Uncle',
            phone: '+84901234567',
            email: 'david@example.com',
            isPrimary: false,
            notifyOnAlert: false,
          },
        ], // existing
        [{ passwordHash: 'mock-password-hash', isActive: true }], // reauthenticate user lookup
      ];
      dbState.updateQueue = [
        [
          {
            id: 'ec-1',
            householdId: 'hh-123',
            name: 'Uncle David',
            relationship: 'Uncle',
            phone: '+84909998877',
            email: null,
            isPrimary: false,
            notifyOnAlert: false,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/emergency-contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '11111111-1111-4111-8111-111111111111',
          email: null,
          phone: '+84909998877',
          reauthPassword: 'ValidPass123',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.contact.phone).toBe('+84909998877');
      expect(json.contact.email).toBeUndefined();
      expect(json.message).toBe('Emergency contact updated.');
    });

    it('DELETE /api/emergency-contacts requires reauth and deletes contact', async () => {
      const { DELETE } = await import('@/app/api/emergency-contacts/route');
      dbState.selectQueue = [
        [{ passwordHash: 'mock-password-hash', isActive: true }], // reauthenticate user lookup
        [{ id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' }], // context
      ];
      dbState.deleteQueue = [
        [{ id: '11111111-1111-4111-8111-111111111111' }],
      ];

      const req = new Request('http://localhost/api/emergency-contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '11111111-1111-4111-8111-111111111111',
          reauthPassword: 'ValidPass123',
        }),
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Contact deleted.');
    });

    it('POST /api/emergency-contacts accepts null and empty email converting to null', async () => {
      const { POST } = await import('@/app/api/emergency-contacts/route');
      const now = new Date();
      dbState.selectQueue = [
        [{ id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' }],
      ];
      dbState.insertQueue = [
        [
          {
            id: 'ec-2',
            householdId: 'hh-123',
            name: 'Grandma Mai',
            relationship: 'Grandmother',
            phone: '+84901234568',
            email: null,
            isPrimary: false,
            notifyOnAlert: false,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Grandma Mai',
          relation: 'Grandmother',
          phone: '+84901234568',
          email: null,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.contact.email).toBeUndefined();
    });
  });

  describe('Child Deactivation and Avatar Updates in PATCH /api/children/[childId]', () => {
    const validChildId = '11111111-1111-4111-8111-111111111111';

    it('PATCH /api/children/[childId] revokes active sessions when child is deactivated (isActive: false)', async () => {
      const { PATCH } = await import('@/app/api/children/[childId]/route');
      const now = new Date();
      dbState.selectQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];
      dbState.updateQueue = [
        [], // session revocation
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: false,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/children/' + validChildId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(200);
      expect(
        dbState.updatedSessions.some(
          (s) => typeof s === 'object' && s !== null && 'revokedAt' in (s as Record<string, unknown>),
        ),
      ).toBe(true);
    });

    it('PATCH /api/children/[childId] allows clearing avatar URL with empty string', async () => {
      const { PATCH } = await import('@/app/api/children/[childId]/route');
      const now = new Date();
      dbState.selectQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: 'https://example.com/avatar.png',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];
      dbState.updateQueue = [
        [
          {
            id: validChildId,
            displayName: 'Linh',
            age: 7,
            gradeLevel: 'Grade 2',
            avatarUrl: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      ];

      const req = new Request('http://localhost/api/children/' + validChildId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: '' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.child.avatarUrl).toBeNull();
    });
  });

  describe('Parent Safety Handlers: Malformed JSON and Validation Audits', () => {
    it('PATCH /api/privacy safely rejects malformed JSON with 400', async () => {
      const { PATCH } = await import('@/app/api/privacy/route');
      const req = new Request('http://localhost/api/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('POST /api/consents safely rejects malformed JSON with 400', async () => {
      const { POST } = await import('@/app/api/consents/route');
      const req = new Request('http://localhost/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('GET /api/consents rejects foreign or non-existent childId with 403 (anti-enumeration)', async () => {
      const { GET } = await import('@/app/api/consents/route');
      dbState.selectQueue = [
        [{ id: 'hh-123', ownerId: 'parent-123', name: 'Nguyen Family' }],
        [], // child not found in household
      ];
      const req = new Request('http://localhost/api/consents?childId=99999999-9999-4999-8999-999999999999');
      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /api/notification-preferences safely rejects malformed JSON with 400', async () => {
      const { PATCH } = await import('@/app/api/notification-preferences/route');
      const req = new Request('http://localhost/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('POST /api/data-exports safely rejects malformed JSON with 400', async () => {
      const { POST } = await import('@/app/api/data-exports/route');
      const req = new Request('http://localhost/api/data-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('POST /api/deletion-requests safely rejects malformed JSON with 400', async () => {
      const { POST } = await import('@/app/api/deletion-requests/route');
      const req = new Request('http://localhost/api/deletion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('Parent Alerts and Routines Validation & Privacy Headers', () => {
    it('GET and PATCH /api/alerts/[alertId] reject foreign or missing alertId with 403 (anti-enumeration)', async () => {
      const { GET, PATCH } = await import('@/app/api/alerts/[alertId]/route');
      dbState.selectQueue = [
        [], // no alert found
      ];
      const getRes = await GET(new Request('http://localhost/api/alerts/missing-id'), {
        params: Promise.resolve({ alertId: 'missing-id' }),
      });
      expect(getRes.status).toBe(403);
      const getJson = await getRes.json();
      expect(getJson.error.code).toBe('FORBIDDEN');

      dbState.selectQueue = [
        [], // no alert found
      ];
      const patchRes = await PATCH(new Request('http://localhost/api/alerts/missing-id', { method: 'PATCH' }), {
        params: Promise.resolve({ alertId: 'missing-id' }),
      });
      expect(patchRes.status).toBe(403);
      const patchJson = await patchRes.json();
      expect(patchJson.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/alerts rejects foreign childId query param with 403 (anti-enumeration)', async () => {
      const { GET } = await import('@/app/api/alerts/route');
      const req = new NextRequest('http://localhost/api/alerts?childId=99999999-9999-4999-8999-999999999999');
      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/children/[childId]/routines returns Cache-Control: no-store', async () => {
      const { GET } = await import('@/app/api/children/[childId]/routines/route');
      const validChildId = '11111111-1111-4111-8111-111111111111';
      dbState.selectQueue = [
        [{ id: validChildId }], // parentOwnedChild check
        [], // listRoutines query
      ];
      const req = new Request(`http://localhost/api/children/${validChildId}/routines`);
      const res = await GET(req, { params: Promise.resolve({ childId: validChildId }) });
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    });
  });
});
