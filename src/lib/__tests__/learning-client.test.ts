import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
const clientPath = "../learning-client.ts";
const {
  fetchLessons,
  fetchLesson,
  createOrResumeAttempt,
  saveAttemptAnswer,
  completeAttempt,
  fetchChildProgress,
  fetchChildAttempts,
  LearningApiError,
  parseApiError,
  normalizeLessonSteps,
} = await import(clientPath);

describe("learning-client contract tests", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchLessons", () => {
    test("returns lessons from direct array response", async () => {
      const mockLessons = [
        { id: "lesson-1", title: "Word Magic", subject: "English" },
        { id: "lesson-2", title: "Count Penguins", subject: "Math" },
      ];

      globalThis.fetch = async (input) => {
        assert.equal(input, "/api/lessons");
        return new Response(JSON.stringify(mockLessons), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await fetchLessons();
      assert.deepEqual(result, mockLessons);
    });

    test("returns lessons from enveloped response { lessons: [...] }", async () => {
      const mockLessons = [{ id: "lesson-1", title: "Word Magic", subject: "English" }];

      globalThis.fetch = async (input) => {
        assert.equal(input, "/api/lessons");
        return new Response(JSON.stringify({ lessons: mockLessons }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await fetchLessons();
      assert.deepEqual(result, mockLessons);
    });

    test("throws LearningApiError on HTTP error status without mock fallback", async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      };

      await assert.rejects(
        async () => {
          await fetchLessons();
        },
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 401);
          assert.equal(apiErr.message, "Unauthorized");
          return true;
        }
      );
    });
  });

  describe("fetchLesson", () => {
    test("fetches lesson by ID and normalizes steps", async () => {
      const lessonPayload = {
        id: "fox-story",
        title: "Brave Fox",
        subject: "Stories",
        content: JSON.stringify({
          steps: [
            {
              id: "step-1",
              title: "Meet Fox",
              prompt: "How does the fox feel?",
              options: [{ id: "brave", label: "Brave" }],
            },
          ],
        }),
      };

      globalThis.fetch = async (input) => {
        assert.equal(input, "/api/lessons/fox-story");
        return new Response(JSON.stringify({ lesson: lessonPayload }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await fetchLesson("fox-story");
      assert.equal(result.id, "fox-story");
      assert.equal(result.title, "Brave Fox");
      assert.equal(result.steps.length, 1);
      assert.equal(result.steps[0].id, "step-1");
      assert.equal(result.steps[0].prompt, "How does the fox feel?");
    });

    test("throws LearningApiError on 404 Not Found", async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: "Lesson not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      };

      await assert.rejects(
        async () => {
          await fetchLesson("non-existent");
        },
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 404);
          assert.equal(apiErr.message, "Lesson not found");
          return true;
        }
      );
    });
  });

  describe("createOrResumeAttempt", () => {
    test("sends POST /api/lesson-attempts with lessonId body", async () => {
      const mockAttempt = {
        id: "att-123",
        childId: "child-1",
        lessonId: "lesson-abc",
        status: "in_progress",
        answers: {},
      };

      globalThis.fetch = async (input, init) => {
        assert.equal(input, "/api/lesson-attempts");
        assert.equal(init?.method, "POST");
        assert.deepEqual(JSON.parse(init?.body as string), { lessonId: "lesson-abc" });
        return new Response(JSON.stringify({ attempt: mockAttempt }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await createOrResumeAttempt("lesson-abc");
      assert.equal(result.id, "att-123");
      assert.equal(result.status, "in_progress");
    });
  });

  describe("saveAttemptAnswer", () => {
    test("sends PUT /api/lesson-attempts/:attemptId/answers with stepId and answer", async () => {
      const updatedAttempt = {
        id: "att-123",
        childId: "child-1",
        lessonId: "lesson-abc",
        status: "in_progress",
        answers: { "step-1": "happy" },
      };

      globalThis.fetch = async (input, init) => {
        assert.equal(input, "/api/lesson-attempts/att-123/answers");
        assert.equal(init?.method, "PUT");
        assert.deepEqual(JSON.parse(init?.body as string), {
          stepId: "step-1",
          answer: "happy",
        });
        return new Response(JSON.stringify(updatedAttempt), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await saveAttemptAnswer("att-123", "step-1", "happy");
      assert.equal(result.id, "att-123");
      assert.equal(result.answers?.["step-1"], "happy");
    });
  });

  describe("completeAttempt", () => {
    test("sends POST /api/lesson-attempts/:attemptId/complete", async () => {
      const completedAttempt = {
        id: "att-123",
        childId: "child-1",
        lessonId: "lesson-abc",
        status: "completed",
        score: 100,
        completedAt: new Date().toISOString(),
      };

      globalThis.fetch = async (input, init) => {
        assert.equal(input, "/api/lesson-attempts/att-123/complete");
        assert.equal(init?.method, "POST");
        return new Response(JSON.stringify({ attempt: completedAttempt }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await completeAttempt("att-123");
      assert.equal(result.status, "completed");
      assert.equal(result.score, 100);
      assert.ok(result.completedAt);
    });
  });

  describe("fetchChildProgress and fetchChildAttempts", () => {
    test("fetches child progress from GET /api/children/:childId/progress", async () => {
      const progressData = {
        childId: "child-minh",
        practiceTimeMinutes: 45,
        lessonsCompleted: 4,
        totalLessons: 8,
        skills: [{ label: "Reading", value: 80 }],
      };

      globalThis.fetch = async (input) => {
        assert.equal(input, "/api/children/child-minh/progress");
        return new Response(JSON.stringify({ progress: progressData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await fetchChildProgress("child-minh");
      assert.equal(result.childId, "child-minh");
      assert.equal(result.lessonsCompleted, 4);
      assert.equal(result.skills?.[0].label, "Reading");
    });

    test("fetches child attempts from GET /api/children/:childId/attempts", async () => {
      const attemptsData = [
        {
          id: "att-1",
          lessonId: "lesson-1",
          lessonTitle: "Story Time",
          status: "completed",
          score: 95,
        },
      ];

      globalThis.fetch = async (input) => {
        assert.equal(input, "/api/children/child-minh/attempts");
        return new Response(JSON.stringify({ attempts: attemptsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await fetchChildAttempts("child-minh");
      assert.equal(result.length, 1);
      assert.equal(result[0].id, "att-1");
      assert.equal(result[0].status, "completed");
    });
  });

  describe("validation guards", () => {
    test("rejects empty IDs early without network call", async () => {
      await assert.rejects(() => fetchLesson(""), /lessonId is required/);
      await assert.rejects(() => createOrResumeAttempt(""), /lessonId is required/);
      await assert.rejects(() => saveAttemptAnswer("", "step-1", "ans"), /attemptId is required/);
      await assert.rejects(() => saveAttemptAnswer("att-1", "", "ans"), /stepId is required/);
      await assert.rejects(() => completeAttempt(""), /attemptId is required/);
      await assert.rejects(() => fetchChildProgress(""), /childId is required/);
      await assert.rejects(() => fetchChildAttempts(""), /childId is required/);
    });
  });

  describe("parseApiError and nested error contract", () => {
    test("parses nested error contract { error: { code, message, details, requestId } }", () => {
      const payload = {
        error: {
          code: "LESSON_NOT_FOUND",
          message: "The requested lesson is unavailable",
          details: { lessonId: ["invalid or unpublished"] },
          requestId: "req-trace-999",
        },
      };

      const err = parseApiError(payload, 404, "Not Found");
      assert.ok(err instanceof LearningApiError);
      assert.equal(err.status, 404);
      assert.equal(err.message, "The requested lesson is unavailable");
      assert.equal(err.code, "LESSON_NOT_FOUND");
      assert.deepEqual(err.details, { lessonId: ["invalid or unpublished"] });
      assert.equal(err.requestId, "req-trace-999");
    });

    test("parses simple string error { error: string }", () => {
      const err = parseApiError({ error: "Access token expired" }, 401);
      assert.equal(err.status, 401);
      assert.equal(err.message, "Access token expired");
      assert.equal(err.code, undefined);
    });

    test("parses object with top-level message, code, details, and requestId", () => {
      const payload = {
        message: "Step answer invalid format",
        code: "INVALID_ANSWER",
        details: { stepId: ["required"] },
        requestId: "req-val-123",
      };

      const err = parseApiError(payload, 422);
      assert.equal(err.status, 422);
      assert.equal(err.message, "Step answer invalid format");
      assert.equal(err.code, "INVALID_ANSWER");
      assert.deepEqual(err.details, { stepId: ["required"] });
      assert.equal(err.requestId, "req-val-123");
    });

    test("falls back safely when response is non-object, empty, or unparseable", () => {
      const err1 = parseApiError(null, 500, "Internal Server Error");
      assert.equal(err1.status, 500);
      assert.equal(err1.message, "Internal Server Error");

      const err2 = parseApiError("plain string error", 503);
      assert.equal(err2.status, 503);
      assert.equal(err2.message, "Request failed with status 503");
    });

    test("LearningApiError constructor handles both options object and legacy details argument", () => {
      const errWithOptions = new LearningApiError("Failed", 400, {
        code: "BAD_REQ",
        details: { foo: "bar" },
        requestId: "req-1",
      });
      assert.equal(errWithOptions.code, "BAD_REQ");
      assert.deepEqual(errWithOptions.details, { foo: "bar" });
      assert.equal(errWithOptions.requestId, "req-1");

      const errWithDetails = new LearningApiError("Failed", 400, { foo: "bar" });
      assert.deepEqual(errWithDetails.details, { foo: "bar" });
      assert.equal(errWithDetails.code, undefined);
    });
  });

  describe("API methods propagate nested errors consistently", () => {
    test("fetchLesson throws LearningApiError with code, message, details, and requestId", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: "LESSON_FORBIDDEN",
              message: "Parental lock active",
              details: { childAge: ["restricted"] },
              requestId: "req-lock-456",
            },
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      };

      await assert.rejects(
        () => fetchLesson("locked-lesson"),
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 403);
          assert.equal(apiErr.code, "LESSON_FORBIDDEN");
          assert.equal(apiErr.message, "Parental lock active");
          assert.deepEqual(apiErr.details, { childAge: ["restricted"] });
          assert.equal(apiErr.requestId, "req-lock-456");
          return true;
        }
      );
    });

    test("createOrResumeAttempt throws LearningApiError on nested server error", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: "ACTIVE_SESSION_LIMIT",
              message: "Too many active sessions",
              requestId: "req-limit-789",
            },
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      };

      await assert.rejects(
        () => createOrResumeAttempt("lesson-1"),
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 429);
          assert.equal(apiErr.code, "ACTIVE_SESSION_LIMIT");
          assert.equal(apiErr.message, "Too many active sessions");
          assert.equal(apiErr.requestId, "req-limit-789");
          return true;
        }
      );
    });

    test("saveAttemptAnswer throws LearningApiError on nested validation error", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_STEP_ID",
              message: "Step ID does not exist in lesson",
              details: { stepId: ["not_found"] },
              requestId: "req-ans-101",
            },
          }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      };

      await assert.rejects(
        () => saveAttemptAnswer("att-1", "bad-step", "choice"),
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 422);
          assert.equal(apiErr.code, "INVALID_STEP_ID");
          assert.equal(apiErr.message, "Step ID does not exist in lesson");
          assert.deepEqual(apiErr.details, { stepId: ["not_found"] });
          assert.equal(apiErr.requestId, "req-ans-101");
          return true;
        }
      );
    });

    test("completeAttempt throws LearningApiError on nested error", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: "ATTEMPT_ALREADY_COMPLETED",
              message: "This lesson attempt is already finalized",
              requestId: "req-comp-202",
            },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      };

      await assert.rejects(
        () => completeAttempt("att-1"),
        (err: unknown) => {
          assert.ok(err instanceof LearningApiError);
          const apiErr = err as InstanceType<typeof LearningApiError>;
          assert.equal(apiErr.status, 409);
          assert.equal(apiErr.code, "ATTEMPT_ALREADY_COMPLETED");
          assert.equal(apiErr.message, "This lesson attempt is already finalized");
          assert.equal(apiErr.requestId, "req-comp-202");
          return true;
        }
      );
    });
  });

  describe("normalizeLessonSteps (no fabricated content regression)", () => {
    test("returns empty array when lesson is null, undefined, or empty object", () => {
      assert.deepEqual(normalizeLessonSteps(null), []);
      assert.deepEqual(normalizeLessonSteps(undefined), []);
      assert.deepEqual(normalizeLessonSteps({}), []);
    });

    test("returns empty array when steps is absent, null, or empty array", () => {
      assert.deepEqual(normalizeLessonSteps({ title: "Count Bears" }), []);
      assert.deepEqual(normalizeLessonSteps({ title: "Count Bears", steps: [] }), []);
    });

    test("returns empty array when steps contains malformed steps missing id", () => {
      const malformedLesson = {
        title: "Bad Steps Lesson",
        steps: [
          { id: "", title: "Empty ID" } as unknown as { id: string; title: string },
          { notAnId: "xyz" } as unknown as { id: string; title: string },
        ],
      };
      assert.deepEqual(normalizeLessonSteps(malformedLesson), []);
    });

    test("never invents a step when content is plain text or invalid JSON", () => {
      const plainTextLesson = {
        title: "Fox Story",
        content: "Once upon a time in a snowy pine forest...",
      };
      assert.deepEqual(normalizeLessonSteps(plainTextLesson), []);

      const brokenJsonLesson = {
        title: "Broken JSON",
        content: "{ invalid json string",
      };
      assert.deepEqual(normalizeLessonSteps(brokenJsonLesson), []);

      const nonStepJsonLesson = {
        title: "Non Step JSON",
        content: JSON.stringify({ summary: "Story overview only", character: "Snow" }),
      };
      assert.deepEqual(normalizeLessonSteps(nonStepJsonLesson), []);
    });

    test("never invents options when step has no options or empty options", () => {
      const lessonWithoutOptions = {
        id: "les-read",
        title: "Reading Card",
        steps: [
          {
            id: "step-1",
            title: "Look at the Fox",
            prompt: "What color is the fox?",
            // No options property supplied
          },
        ],
      };

      const normalized = normalizeLessonSteps(lessonWithoutOptions);
      assert.equal(normalized.length, 1);
      assert.equal(normalized[0].id, "step-1");
      assert.equal(normalized[0].prompt, "What color is the fox?");
      assert.equal(normalized[0].options, undefined);
    });

    test("filters out malformed options without adding fabricated choices", () => {
      const lessonWithBadOptions = {
        id: "les-opts",
        title: "Option Test",
        steps: [
          {
            id: "step-1",
            title: "Choose color",
            options: [
              { id: "red", label: "Red" },
              { id: "", label: "No ID" },
              { id: "blue", label: "" },
              null as unknown as { id: string; label: string },
            ],
          },
        ],
      };

      const normalized = normalizeLessonSteps(lessonWithBadOptions);
      assert.equal(normalized.length, 1);
      assert.equal(normalized[0].options?.length, 1);
      assert.equal(normalized[0].options?.[0].id, "red");
      assert.equal(normalized[0].options?.[0].label, "Red");
    });

    test("preserves valid steps from JSON string content", () => {
      const validContentLesson = {
        id: "les-content",
        title: "Valid JSON Content",
        content: JSON.stringify({
          steps: [
            {
              id: "st-1",
              title: "Step One",
              prompt: "Select number 3",
              options: [
                { id: "opt-3", label: "Three" },
                { id: "opt-4", label: "Four" },
              ],
            },
          ],
        }),
      };

      const normalized = normalizeLessonSteps(validContentLesson);
      assert.equal(normalized.length, 1);
      assert.equal(normalized[0].id, "st-1");
      assert.equal(normalized[0].options?.length, 2);
    });
  });

  describe("completion score fidelity", () => {
    test("completeAttempt preserves server score and does not fabricate score", async () => {
      const serverAttemptWithoutScore = {
        id: "att-noscore",
        childId: "child-1",
        lessonId: "lesson-abc",
        status: "completed",
        // score is null / omitted
        completedAt: new Date().toISOString(),
      };

      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ attempt: serverAttemptWithoutScore }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await completeAttempt("att-noscore");
      assert.equal(result.status, "completed");
      assert.equal(result.score, undefined);
    });
  });
});
