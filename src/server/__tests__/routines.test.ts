import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { transaction: mocks.transaction } }));

describe('routine step completion persistence', () => {
  beforeEach(() => vi.resetAllMocks());

  it('is idempotent for a child step and local date and audits only the first insert', async () => {
    const { auditEvents, routineStepCompletions } = await import('@/db/schema');
    const keys = new Set<string>();
    const auditRows: unknown[] = [];
    type InsertBuilder = {
      values(input: unknown): InsertBuilder | Promise<unknown[]>;
      onConflictDoNothing(): InsertBuilder;
      returning(): Promise<Array<{ id: string }>>;
    };
    const tx = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => ({ limit: async () => [{ id: 'step-id', routineId: 'routine-id' }] }),
          }),
        }),
      }),
      insert: (table: unknown) => {
        let value: Record<string, unknown> | undefined;
        const builder: InsertBuilder = {
          values: (input: unknown) => {
            value = input as Record<string, unknown>;
            if (table === auditEvents) {
              auditRows.push(input);
              return Promise.resolve([]);
            }
            return builder;
          },
          onConflictDoNothing: () => builder,
          returning: async () => {
            if (table !== routineStepCompletions) return [];
            const key = `${value?.routineStepId}:${value?.completionDate}`;
            if (keys.has(key)) return [];
            keys.add(key);
            return [{ id: 'completion-id' }];
          },
        };
        return builder;
      },
    };
    mocks.transaction.mockImplementation((callback: (transaction: typeof tx) => unknown) => callback(tx));

    const { setRoutineStepCompletion } = await import('@/server/routines');
    const first = await setRoutineStepCompletion('child-id', 'step-id', '2026-10-03', true);
    const retry = await setRoutineStepCompletion('child-id', 'step-id', '2026-10-03', true);
    expect(first).toEqual({ stepId: 'step-id', completed: true, completionDate: '2026-10-03' });
    expect(retry).toEqual(first);
    expect(keys.size).toBe(1);
    expect(auditRows).toHaveLength(1);
  });
});
