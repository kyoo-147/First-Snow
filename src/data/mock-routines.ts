import type { Routine } from "@/types/snow";

export const mockRoutines: Routine[] = [
  {
    id: "routine-1",
    childId: "minh",
    title: "Morning Routine",
    date: "2026-06-15T07:30:00.000Z",
    timeOfDay: "morning",
    isActive: true,
    steps: [
      { id: "step-1", title: "Wake up and stretch", durationMinutes: 5, isCompleted: true },
      { id: "step-2", title: "Brush teeth", durationMinutes: 3, isCompleted: true },
      { id: "step-3", title: "Feelings check-in with AgentKid", durationMinutes: 5, isCompleted: false },
    ],
  },
  {
    id: "routine-2",
    childId: "minh",
    title: "Bedtime Routine",
    date: "2026-06-15T20:30:00.000Z",
    timeOfDay: "evening",
    isActive: true,
    steps: [
      { id: "step-4", title: "Read a story", durationMinutes: 15, isCompleted: false },
      { id: "step-5", title: "Breathing exercise", durationMinutes: 5, isCompleted: false },
    ],
  }
];
