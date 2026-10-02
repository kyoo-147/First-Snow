"use client";

import { ParentLearningView } from "@/components/learning/parent-learning-view";

export function ParentLearningScreen({ childId = "minh" }: { childId?: string }) {
  return <ParentLearningView childId={childId} />;
}
