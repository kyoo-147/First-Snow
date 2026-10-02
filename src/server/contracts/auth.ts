import { z } from 'zod';

// ── Parent auth contracts ────────────────────────────────────────────────────

export const RegisterParentSchema = z.object({
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
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(255)
    .trim(),
  householdName: z.string().min(1, 'Household name is required').max(255).trim(),
});

export const LoginParentSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ── Child auth contracts ─────────────────────────────────────────────────────

export const CreateChildSchema = z.object({
  displayName: z.string().min(1).max(255).trim(),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
  gradeLevel: z.string().max(50).optional(),
  age: z.number().int().min(3).max(18).optional(),
});

export const ChildLoginSchema = z.object({
  childId: z.string().uuid('Child ID must be a valid UUID'),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
});

// ── Common error response contract ───────────────────────────────────────────

export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.array(z.string())).optional(),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type RegisterParentInput = z.infer<typeof RegisterParentSchema>;
export type LoginParentInput = z.infer<typeof LoginParentSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type ChildLoginInput = z.infer<typeof ChildLoginSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
