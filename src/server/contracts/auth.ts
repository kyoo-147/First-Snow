import { z } from 'zod';

// ── Parent auth contracts ─────────────────────────────────────────────────────

/**
 * POST /api/auth/register — UI sends { name, email, password } or { displayName, email, password, householdName }.
 * `name` maps to `displayName` in the DB; household name is derived as "{name}'s Family" or from householdName.
 */
export const RegisterParentSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim().optional(),
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(255).trim().optional(),
    email: z
      .string()
      .email({ message: 'Valid email required' })
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    householdName: z.string().max(255).trim().optional(),
  })
  .refine((data) => Boolean(data.name || data.displayName), {
    message: 'Name is required and must be at least 2 characters',
    path: ['name'],
  });

export const LoginParentSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ── Child auth contracts ──────────────────────────────────────────────────────

/**
 * POST /api/children — UI sends { name, pin, age?, grade?, comfortStyle? }.
 */
export const CreateChildSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255).trim().optional(),
    displayName: z.string().min(1, 'Display name is required').max(255).trim().optional(),
    pin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
    age: z.number().int().min(3).max(18).optional(),
    grade: z.string().max(50).optional(),
    gradeLevel: z.string().max(50).optional(),
    comfortStyle: z.string().max(100).optional(),
  })
  .refine((data) => Boolean(data.name || data.displayName), {
    message: 'Name is required',
    path: ['name'],
  });

/**
 * POST /api/auth/child-login — UI sends { childId, pin }.
 */
export const ChildLoginSchema = z.object({
  childId: z.string().uuid('Child ID must be a valid UUID'),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
});

// ── API error shape ───────────────────────────────────────────────────────────

/**
 * Nested error contract:
 * { error: { code, message, details?, requestId? } }
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.union([z.array(z.string()), z.string()])).optional(),
    requestId: z.string().optional(),
  }),
});

// ── Session & Children response schemas ───────────────────────────────────────

export const SessionResponseSchema = z.object({
  session: z
    .union([
      z.object({
        actorType: z.enum(['parent', 'admin']),
        user: z.object({
          id: z.string().uuid(),
          email: z.string().email(),
          name: z.string(),
          role: z.enum(['parent', 'admin']),
          householdId: z.string().uuid().nullable().optional(),
        }),
      }),
      z.object({
        actorType: z.literal('child'),
        child: z.object({
          id: z.string().uuid(),
          name: z.string(),
          householdId: z.string().uuid(),
        }),
      }),
      z.null(),
    ]),
});

export const ChildrenListResponseSchema = z.object({
  children: z.array(
    z.object({
      id: z.string().uuid(),
      displayName: z.string(),
      name: z.string().optional(),
      age: z.number().nullable().optional(),
      gradeLevel: z.string().nullable().optional(),
      grade: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
      isActive: z.boolean(),
      createdAt: z.date().or(z.string()).optional(),
    }),
  ),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type RegisterParentInput = z.infer<typeof RegisterParentSchema>;
export type LoginParentInput = z.infer<typeof LoginParentSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type ChildLoginInput = z.infer<typeof ChildLoginSchema>;
export type ApiErrorShape = z.infer<typeof ApiErrorSchema>;
export type SessionResponseShape = z.infer<typeof SessionResponseSchema>;
export type ChildrenListResponseShape = z.infer<typeof ChildrenListResponseSchema>;
