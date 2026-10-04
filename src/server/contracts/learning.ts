import { z } from 'zod';

// ── Lesson attempt request contracts ─────────────────────────────────────────

/** POST /api/lesson-attempts — start or resume an attempt for a lesson. */
export const CreateLessonAttemptSchema = z.object({
  lessonId: z.string().uuid(),
});

/** PUT /api/lesson-attempts/:attemptId/answers — autosave one step answer. */
export const SaveLessonAnswerSchema = z.object({
  stepId: z.string().uuid(),
  answer: z.unknown(),
});

/** Route params validated before loading a lesson or attempt. */
export const LessonIdParamSchema = z.string().uuid();
export const AttemptIdParamSchema = z.string().uuid();

// ── Lesson response contracts ────────────────────────────────────────────────

export const LessonStepOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  helper: z.string().optional(),
  tone: z.string().optional(),
  icon: z.string().optional(),
});

export const LessonStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string().optional(),
  instruction: z.string().optional(),
  helper: z.string().optional(),
  image: z.string().optional(),
  options: z.array(LessonStepOptionSchema).optional(),
  correctAnswer: z.string().optional(),
  audioUrl: z.string().optional(),
});

export const LessonSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subject: z.string(),
  gradeLevel: z.string().nullable().optional(),
  estimatedMinutes: z.number().optional(),
  subtitle: z.string().optional(),
  description: z.string().nullable().optional(),
  rating: z.string().optional(),
  image: z.string().optional(),
  accent: z.enum(['primary', 'aqua', 'peach', 'pink', 'ice']).optional(),
  progress: z.number().optional(),
  isPublished: z.boolean().optional(),
});

export const LessonDetailSchema = LessonSummarySchema.extend({
  content: z.union([z.string(), z.record(z.unknown())]).nullable().optional(),
  steps: z.array(LessonStepSchema),
});

export const LessonAttemptSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  lessonId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  score: z.number().nullable().optional(),
  answers: z.record(z.unknown()).nullable().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const ChildProgressSkillSchema = z.object({
  label: z.string(),
  value: z.number(),
  note: z.string().optional(),
});

export const ChildProgressSchema = z.object({
  childId: z.string().uuid(),
  practiceTimeMinutes: z.number().optional(),
  lessonsCompleted: z.number().optional(),
  totalLessons: z.number().optional(),
  comfortPattern: z.string().optional(),
  nextFocus: z.string().optional(),
  skills: z.array(ChildProgressSkillSchema).optional(),
});

export const ChildAttemptSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  lessonTitle: z.string().optional(),
  lessonSubtitle: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  score: z.number().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  answers: z.record(z.unknown()).nullable().optional(),
});

// ── Response envelopes (sibling endpoints wrap payloads in a resource key) ───

export const LessonsListResponseSchema = z.object({ lessons: z.array(LessonSummarySchema) });
export const LessonResponseSchema = z.object({ lesson: LessonDetailSchema });
export const LessonAttemptResponseSchema = z.object({ attempt: LessonAttemptSchema });
export const ChildProgressResponseSchema = z.object({ progress: ChildProgressSchema });
export const ChildAttemptsResponseSchema = z.object({ attempts: z.array(ChildAttemptSchema) });

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateLessonAttemptInput = z.infer<typeof CreateLessonAttemptSchema>;
export type SaveLessonAnswerInput = z.infer<typeof SaveLessonAnswerSchema>;
export type LessonStepOptionShape = z.infer<typeof LessonStepOptionSchema>;
export type LessonStepShape = z.infer<typeof LessonStepSchema>;
export type LessonSummaryShape = z.infer<typeof LessonSummarySchema>;
export type LessonDetailShape = z.infer<typeof LessonDetailSchema>;
export type LessonAttemptShape = z.infer<typeof LessonAttemptSchema>;
export type ChildProgressShape = z.infer<typeof ChildProgressSchema>;
export type ChildAttemptShape = z.infer<typeof ChildAttemptSchema>;
export type LessonsListResponseShape = z.infer<typeof LessonsListResponseSchema>;
export type LessonResponseShape = z.infer<typeof LessonResponseSchema>;
export type ChildProgressResponseShape = z.infer<typeof ChildProgressResponseSchema>;
export type ChildAttemptsResponseShape = z.infer<typeof ChildAttemptsResponseSchema>;
