"use client";

import { InteractiveLessonRunner } from "@/components/learning/interactive-lesson-runner";

export function InteractiveLessonScreen({ lessonId = "magic-word-box" }: { lessonId?: string }) {
  return <InteractiveLessonRunner lessonId={lessonId} />;
}
