import { z } from 'zod';

export const QuestionTypeSchema = z.enum([
  'single_choice',
  'multiple_choice',
  'ordering',
  'true_false',
  'fill_blank',
  'short_answer',
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const LessonTrackSchema = z.enum([
  'literacy',
  'mathematics',
  'stories_comprehension',
  'social_emotional_safety',
  'basic_science',
]);

export type LessonTrack = z.infer<typeof LessonTrackSchema>;

export const LessonStepOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  helper: z.string().optional(),
  tone: z.string().optional(),
  icon: z.string().optional(),
});

export type LessonStepOption = z.infer<typeof LessonStepOptionSchema>;

export const LessonQuestionStepSchema = z.object({
  id: z.string().min(1),
  stepOrder: z.number().int().positive().optional(),
  questionType: QuestionTypeSchema,
  prompt: z.string().min(1),
  instruction: z.string().optional(),
  helper: z.string().optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  image: z.string().optional(),
  options: z.array(LessonStepOptionSchema).optional(),
  canonicalAnswer: z.union([
    z.string(),
    z.boolean(),
    z.array(z.string()),
  ]),
  acceptedVariants: z.array(z.string()).optional(),
  points: z.number().int().nonnegative().default(10),
});

export type LessonQuestionStep = z.infer<typeof LessonQuestionStepSchema>;

export interface GradingResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  explanation?: string;
  hint?: string;
  validationError?: string;
}
