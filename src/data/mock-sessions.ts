import type { Session } from "@/types/snow";

export const mockSessions: Session[] = [
  {
    id: "session-1",
    childId: "minh",
    title: "Morning Routine Check-in",
    date: "2026-06-14T09:30:00.000Z",
    durationMinutes: 12,
    mood: "happy",
    highlights: ["Minh correctly identified 3 emotions", "Used calming techniques"],
  },
  {
    id: "session-2",
    childId: "minh",
    title: "Calming Down Practice",
    date: "2026-06-13T09:30:00.000Z",
    durationMinutes: 8,
    mood: "calm",
    highlights: ["Practiced deep breathing"],
  },
  {
    id: "session-3",
    childId: "mai-nguyen",
    title: "Bedtime Story",
    date: "2026-06-15T12:30:00.000Z",
    durationMinutes: 15,
    mood: "calm",
    highlights: ["Listened to 'The Brave Little Fox'", "Fell asleep easily"],
  }
];
