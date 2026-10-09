# Task Report: task_450cfee66d54 - Bounded Next Wave of Vietnamese Lessons

## 1. Outcome
- **Status**: VERIFIED
- **Commit SHA**: `4c6e5e0a3826381af3aa421122c4ea371d8f20f3`
- **Summary**: Added a bounded next wave of 6 substantive Vietnamese lessons (Lessons 25–30, 30 total interactive steps) across all 5 existing tracks (`literacy`, `mathematics`, `stories_comprehension`, `social_emotional_safety`, `basic_science`), bringing the catalog to exactly 6 lessons per track (30 lessons total). All lessons adhere strictly to the existing schema, utilize approved local imagery (`/images/lesson-abc.png`, `/images/lesson-math.png`, `/images/lesson-story.png`, `/images/lesson-social.png`), enforce deterministic fail-closed grading, and protect secret grading keys (`canonicalAnswer`, `acceptedVariants`, `correctAnswer`, `explanation`) from public payloads.

## 2. Added Curriculum Details
1. **Lesson 25** (`00000000-0000-4000-a000-000000000019`): "Mở rộng vốn từ: Gia đình và Trường lớp"
   - Track: `literacy` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-abc.png`
2. **Lesson 26** (`00000000-0000-4000-a000-00000000001a`): "So sánh lớn hơn, bé hơn và bằng nhau"
   - Track: `mathematics` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-math.png`
3. **Lesson 27** (`00000000-0000-4000-a000-00000000001b`): "Cậu bé Tích Chu: Lòng hiếu thảo và tình yêu thương"
   - Track: `stories_comprehension` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-story.png`
4. **Lesson 28** (`00000000-0000-4000-a000-00000000001c`): "Kỹ năng an toàn khi tham gia giao thông và băng qua đường"
   - Track: `social_emotional_safety` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-social.png`
5. **Lesson 29** (`00000000-0000-4000-a000-00000000001d`): "Năm giác quan kỳ diệu của cơ thể bé"
   - Track: `basic_science` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-story.png`
6. **Lesson 30** (`00000000-0000-4000-a000-00000000001e`): "Động vật quanh em: Vật nuôi trong nhà và động vật hoang dã"
   - Track: `basic_science` | Grade: Lớp 1 - 2 | 5 câu hỏi | Asset: `/images/lesson-story.png`

## 3. Files Modified
- `src/db/lessons-data/literacy.ts`: Added Lesson 25 with 5 steps.
- `src/db/lessons-data/mathematics.ts`: Added Lesson 26 with 5 steps.
- `src/db/lessons-data/stories.ts`: Added Lesson 27 with 5 steps.
- `src/db/lessons-data/social.ts`: Added Lesson 28 with 5 steps.
- `src/db/lessons-data/science.ts`: Added Lessons 29 and 30 with 5 steps each.
- `docs/lessons/LESSON_CONTENT_AND_GRADING.md`: Updated curriculum table and totals to 30 lessons.
- `src/db/__tests__/seed-lessons.test.ts`: Expanded tests to verify 30 lessons and added automated schema/grading validation across all catalog steps.
- `src/server/__tests__/learning-grading.test.ts`: Added catalog-wide test verifying secret key stripping on all published lesson content.

## 4. Verification Commands & Results
- `npx vitest run src/db/__tests__/seed-lessons.test.ts`: PASSED (8 tests passed, validating 30 lessons, deterministic UUIDs, schema conformance and idempotent upserts).
- `npx vitest run src/server/__tests__/learning-grading.test.ts`: PASSED (9 tests passed, validating deterministic grading, attempt scoring, fail-closed completion, and full key stripping).
- `npx vitest run src/lib/lesson-engine/__tests__/grader.test.ts`: PASSED (19 tests passed).
- `npx vitest run src/server/__tests__/learning-routes.test.ts`: PASSED (9 tests passed).
- `npx vitest run src/components/learning/__tests__/interactive-lesson-runner.test.tsx`: PASSED (1 test passed).
- Full Test Suite (`npm test`): PASSED (41 test files, 423 unit tests, 87 contract tests, 24 voice client tests).
- Typecheck (`npm run typecheck`): PASSED (tsc --noEmit with 0 errors).
- Diff Audit (`git diff`): PASSED (bounded changes only in lesson data, test suites, and documentation).

## 5. Items Checklist
- **VERIFIED**:
  - All 6 new lessons added with valid RFC4122 deterministic UUIDs and >= 5 questions each.
  - Existing schema (`LessonQuestionStepSchema`) satisfied 100% across all 150 catalog questions.
  - Approved image assets strictly adhered to (no new image generation).
  - Deterministic grading and Unicode NFC normalization functioning properly.
  - Secret grading keys stripped from public payloads.
  - Incomplete attempts fail closed.
  - Full test suite, contract tests, and typecheck clean.
- **BLOCKED**: None.
- **UNVERIFIED**: None.
