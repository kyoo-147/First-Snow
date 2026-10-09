import {
  type LessonQuestionStep,
  type GradingResult,
  LessonQuestionStepSchema,
} from './types';

/**
 * Normalizes text for short answer / fill in blank grading:
 * - Unicode NFC normalization
 * - Leading/trailing trim
 * - Repeated whitespace collapsed to a single space
 * - Lowercase transformation
 * Note: Vietnamese diacritics are preserved as significant.
 */
export function normalizeShortAnswer(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Deterministically grades a submitted answer against a LessonQuestionStep.
 * Fails closed on malformed input, missing answers, or invalid types.
 */
export function gradeStepAnswer(
  step: LessonQuestionStep,
  rawAnswer: unknown
): GradingResult {
  const maxScore = typeof step.points === 'number' ? step.points : 10;

  // Validate step structure
  const stepValidation = LessonQuestionStepSchema.safeParse(step);
  if (!stepValidation.success) {
    return {
      isCorrect: false,
      score: 0,
      maxScore,
      validationError: 'Invalid step definition schema',
      explanation: step.explanation,
      hint: step.hint,
    };
  }

  if (rawAnswer === null || rawAnswer === undefined) {
    return {
      isCorrect: false,
      score: 0,
      maxScore,
      validationError: 'Answer is missing',
      explanation: step.explanation,
      hint: step.hint,
    };
  }

  const { questionType, canonicalAnswer, acceptedVariants, options } = step;

  switch (questionType) {
    case 'single_choice': {
      if (typeof rawAnswer !== 'string' || !rawAnswer.trim()) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Expected option ID string for single choice',
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      const answerId = rawAnswer.trim();
      const optionExists = options?.some((opt) => opt.id === answerId);
      if (!optionExists) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: `Answer ${answerId} is not a valid option ID`,
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      const isCorrect = answerId === canonicalAnswer;
      return {
        isCorrect,
        score: isCorrect ? maxScore : 0,
        maxScore,
        explanation: step.explanation,
        hint: step.hint,
      };
    }

    case 'multiple_choice': {
      if (!Array.isArray(rawAnswer) || !Array.isArray(canonicalAnswer)) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Expected array of option IDs for multiple choice',
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      // Ensure all elements are non-empty strings and valid options
      const userSet = new Set<string>();
      for (const item of rawAnswer) {
        if (typeof item !== 'string' || !item.trim()) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            validationError: 'Invalid option ID in answer array',
            explanation: step.explanation,
            hint: step.hint,
          };
        }
        if (userSet.has(item.trim())) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            validationError: 'Duplicate option IDs are not allowed',
            explanation: step.explanation,
            hint: step.hint,
          };
        }
        const optionExists = options?.some((opt) => opt.id === item.trim());
        if (!optionExists) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            validationError: `Option ID ${item} does not exist in choices`,
            explanation: step.explanation,
            hint: step.hint,
          };
        }
        userSet.add(item.trim());
      }

      const canonicalSet = new Set<string>(canonicalAnswer.map((s) => s.trim()));
      // Full set equality
      if (userSet.size !== canonicalSet.size) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      for (const optId of userSet) {
        if (!canonicalSet.has(optId)) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            explanation: step.explanation,
            hint: step.hint,
          };
        }
      }
      return {
        isCorrect: true,
        score: maxScore,
        maxScore,
        explanation: step.explanation,
        hint: step.hint,
      };
    }

    case 'ordering': {
      if (!Array.isArray(rawAnswer) || !Array.isArray(canonicalAnswer)) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Expected array of option IDs in order',
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      if (rawAnswer.length !== canonicalAnswer.length) {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      const seen = new Set<string>();
      for (let i = 0; i < rawAnswer.length; i++) {
        const item = rawAnswer[i];
        if (typeof item !== 'string' || !item.trim()) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            validationError: 'Invalid item in ordering array',
            explanation: step.explanation,
            hint: step.hint,
          };
        }
        if (seen.has(item)) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            validationError: 'Duplicate item in ordering array',
            explanation: step.explanation,
            hint: step.hint,
          };
        }
        seen.add(item);
        if (item.trim() !== canonicalAnswer[i].trim()) {
          return {
            isCorrect: false,
            score: 0,
            maxScore,
            explanation: step.explanation,
            hint: step.hint,
          };
        }
      }
      return {
        isCorrect: true,
        score: maxScore,
        maxScore,
        explanation: step.explanation,
        hint: step.hint,
      };
    }

    case 'true_false': {
      if (typeof rawAnswer !== 'boolean' || typeof canonicalAnswer !== 'boolean') {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Expected boolean value for true_false question',
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      const isCorrect = rawAnswer === canonicalAnswer;
      return {
        isCorrect,
        score: isCorrect ? maxScore : 0,
        maxScore,
        explanation: step.explanation,
        hint: step.hint,
      };
    }

    case 'fill_blank':
    case 'short_answer': {
      if (typeof rawAnswer !== 'string') {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Expected text string for short answer / fill blank',
          explanation: step.explanation,
          hint: step.hint,
        };
      }
      if (typeof canonicalAnswer !== 'string') {
        return {
          isCorrect: false,
          score: 0,
          maxScore,
          validationError: 'Canonical answer must be a string for short answer',
          explanation: step.explanation,
          hint: step.hint,
        };
      }

      const normalizedInput = normalizeShortAnswer(rawAnswer);
      const normalizedCanonical = normalizeShortAnswer(canonicalAnswer);

      if (normalizedInput === normalizedCanonical) {
        return {
          isCorrect: true,
          score: maxScore,
          maxScore,
          explanation: step.explanation,
          hint: step.hint,
        };
      }

      if (Array.isArray(acceptedVariants)) {
        for (const variant of acceptedVariants) {
          if (typeof variant === 'string' && normalizeShortAnswer(variant) === normalizedInput) {
            return {
              isCorrect: true,
              score: maxScore,
              maxScore,
              explanation: step.explanation,
              hint: step.hint,
            };
          }
        }
      }

      return {
        isCorrect: false,
        score: 0,
        maxScore,
        explanation: step.explanation,
        hint: step.hint,
      };
    }

    default:
      return {
        isCorrect: false,
        score: 0,
        maxScore,
        validationError: `Unsupported question type: ${questionType}`,
      };
  }
}
