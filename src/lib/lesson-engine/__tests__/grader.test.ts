import { describe, expect, it } from 'vitest';
import {
  gradeStepAnswer,
  normalizeShortAnswer,
} from '../grader';
import {
  type LessonQuestionStep,
  type GradingResult,
} from '../types';

describe('Deterministic Lesson Engine - Grader', () => {
  describe('normalizeShortAnswer', () => {
    it('applies Unicode NFC normalization, trimming, and collapses multiple whitespace characters', () => {
      // "  Con   mèo  " with decomposed Unicode
      const decomposed = '  Con   me\u0300o  ';
      const normalized = normalizeShortAnswer(decomposed);
      expect(normalized).toBe('con mèo');
      expect(normalized.normalize('NFC')).toBe(normalized);
    });

    it('preserves Vietnamese diacritics as significant by default', () => {
      expect(normalizeShortAnswer('bút')).toBe('bút');
      expect(normalizeShortAnswer('but')).toBe('but');
      expect(normalizeShortAnswer('bút')).not.toBe(normalizeShortAnswer('but'));
    });
  });

  describe('Single Choice grading', () => {
    const singleChoiceStep: LessonQuestionStep = {
      id: 'step-sc-1',
      questionType: 'single_choice',
      prompt: 'Thủ đô của Việt Nam là gì?',
      canonicalAnswer: 'opt-hanoi',
      options: [
        { id: 'opt-hanoi', label: 'Hà Nội' },
        { id: 'opt-hcm', label: 'TP. Hồ Chí Minh' },
        { id: 'opt-danang', label: 'Đà Nẵng' },
      ],
      points: 10,
    };

    it('grades correct when matching exact option ID', () => {
      const res = gradeStepAnswer(singleChoiceStep, 'opt-hanoi');
      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(10);
      expect(res.maxScore).toBe(10);
    });

    it('grades incorrect when choosing wrong option ID', () => {
      const res = gradeStepAnswer(singleChoiceStep, 'opt-hcm');
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
    });

    it('rejects display text instead of option ID (fail closed)', () => {
      const res = gradeStepAnswer(singleChoiceStep, 'Hà Nội');
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
      expect(res.validationError).toBeDefined();
    });

    it('rejects malformed or empty answer', () => {
      expect(gradeStepAnswer(singleChoiceStep, null).isCorrect).toBe(false);
      expect(gradeStepAnswer(singleChoiceStep, '').isCorrect).toBe(false);
      expect(gradeStepAnswer(singleChoiceStep, ['opt-hanoi']).isCorrect).toBe(false);
      expect(gradeStepAnswer(singleChoiceStep, { id: 'opt-hanoi' }).isCorrect).toBe(false);
    });
  });

  describe('Multiple Choice grading (full set equality)', () => {
    const multiChoiceStep: LessonQuestionStep = {
      id: 'step-mc-1',
      questionType: 'multiple_choice',
      prompt: 'Những từ nào là từ chỉ đồ dùng học tập?',
      canonicalAnswer: ['opt-pen', 'opt-ruler'],
      options: [
        { id: 'opt-pen', label: 'Bút mực' },
        { id: 'opt-dog', label: 'Chú chó' },
        { id: 'opt-ruler', label: 'Thước kẻ' },
      ],
      points: 20,
    };

    it('grades correct when all required options are selected regardless of order', () => {
      expect(gradeStepAnswer(multiChoiceStep, ['opt-pen', 'opt-ruler']).isCorrect).toBe(true);
      expect(gradeStepAnswer(multiChoiceStep, ['opt-ruler', 'opt-pen']).isCorrect).toBe(true);
      expect(gradeStepAnswer(multiChoiceStep, ['opt-pen', 'opt-ruler']).score).toBe(20);
    });

    it('grades incorrect for subset selection (missing an option)', () => {
      const res = gradeStepAnswer(multiChoiceStep, ['opt-pen']);
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
    });

    it('grades incorrect for superset selection (extra wrong option)', () => {
      const res = gradeStepAnswer(multiChoiceStep, ['opt-pen', 'opt-ruler', 'opt-dog']);
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
    });

    it('rejects duplicate IDs or non-array inputs', () => {
      expect(gradeStepAnswer(multiChoiceStep, 'opt-pen').isCorrect).toBe(false);
      expect(gradeStepAnswer(multiChoiceStep, ['opt-pen', 'opt-pen']).isCorrect).toBe(false);
      expect(gradeStepAnswer(multiChoiceStep, ['invalid-id']).isCorrect).toBe(false);
    });
  });

  describe('Ordering grading (exact sequence)', () => {
    const orderingStep: LessonQuestionStep = {
      id: 'step-ord-1',
      questionType: 'ordering',
      prompt: 'Sắp xếp các bước đánh răng theo đúng thứ tự:',
      canonicalAnswer: ['step-paste', 'step-brush', 'step-rinse'],
      options: [
        { id: 'step-paste', label: 'Lấy kem đánh răng' },
        { id: 'step-brush', label: 'Chải răng nhẹ nhàng' },
        { id: 'step-rinse', label: 'Súc miệng bằng nước sạch' },
      ],
      points: 15,
    };

    it('grades correct when sequence matches exactly', () => {
      const res = gradeStepAnswer(orderingStep, ['step-paste', 'step-brush', 'step-rinse']);
      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(15);
    });

    it('grades incorrect if any items are swapped', () => {
      const res = gradeStepAnswer(orderingStep, ['step-brush', 'step-paste', 'step-rinse']);
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
    });

    it('grades incorrect if incomplete or contains duplicates', () => {
      expect(gradeStepAnswer(orderingStep, ['step-paste', 'step-brush']).isCorrect).toBe(false);
      expect(gradeStepAnswer(orderingStep, ['step-paste', 'step-paste', 'step-rinse']).isCorrect).toBe(false);
    });
  });

  describe('True/False grading', () => {
    const tfStep: LessonQuestionStep = {
      id: 'step-tf-1',
      questionType: 'true_false',
      prompt: 'Nước đóng băng ở 0 độ C.',
      canonicalAnswer: true,
      points: 10,
    };

    it('grades correct on boolean match', () => {
      expect(gradeStepAnswer(tfStep, true).isCorrect).toBe(true);
      expect(gradeStepAnswer(tfStep, false).isCorrect).toBe(false);
    });

    it('rejects non-boolean types like strings or numbers', () => {
      expect(gradeStepAnswer(tfStep, 'true').isCorrect).toBe(false);
      expect(gradeStepAnswer(tfStep, 1).isCorrect).toBe(false);
    });
  });

  describe('Short Answer & Fill in Blank grading', () => {
    const shortAnswerStep: LessonQuestionStep = {
      id: 'step-sa-1',
      questionType: 'short_answer',
      prompt: 'Điền tên hành tinh chúng ta đang sống:',
      canonicalAnswer: 'Trái Đất',
      acceptedVariants: ['trai dat', 'Trái đất', 'dia cau'],
      points: 15,
    };

    it('accepts canonical answer with differing whitespace and case', () => {
      expect(gradeStepAnswer(shortAnswerStep, '  trái   đất  ').isCorrect).toBe(true);
      expect(gradeStepAnswer(shortAnswerStep, 'Trái Đất').isCorrect).toBe(true);
    });

    it('accepts explicit accepted variants if authored', () => {
      expect(gradeStepAnswer(shortAnswerStep, 'trai dat').isCorrect).toBe(true);
      expect(gradeStepAnswer(shortAnswerStep, 'dia cau').isCorrect).toBe(true);
    });

    it('strictly rejects non-matching answers', () => {
      expect(gradeStepAnswer(shortAnswerStep, 'Sao Hỏa').isCorrect).toBe(false);
      expect(gradeStepAnswer(shortAnswerStep, 'Mặt Trăng').isCorrect).toBe(false);
    });

    it('rejects diacritic mismatch when not in acceptedVariants', () => {
      const strictStep: LessonQuestionStep = {
        id: 'step-sa-strict',
        questionType: 'fill_blank',
        prompt: 'Vật dùng để viết bảng phấn:',
        canonicalAnswer: 'viên phấn',
        points: 10,
      };

      expect(gradeStepAnswer(strictStep, 'viên phấn').isCorrect).toBe(true);
      // 'vien phan' without diacritics is NOT accepted because it's not in acceptedVariants
      expect(gradeStepAnswer(strictStep, 'vien phan').isCorrect).toBe(false);
    });
  });
});
