export * from "./mock-parent";
export * from "./mock-children";
export * from "./mock-sessions";
export * from "./mock-emotions";
export * from "./mock-transcripts";
export * from "./mock-routines";
export * from "./mock-alerts";
export * from "./mock-settings";
export * from "./mock-admin";
export * from "./mock-lessons";

// Import data for helpers
import { mockChildren } from "./mock-children";
import { mockSessions } from "./mock-sessions";
import { mockTranscripts } from "./mock-transcripts";
import { mockEmotions } from "./mock-emotions";
import { mockAlerts } from "./mock-alerts";
import { mockLessons } from "./mock-lessons";
import { mockRoutines } from "./mock-routines";

// Helpers
export function getChildById(id: string) {
  return mockChildren.find((child) => child.id === id) || mockChildren[0]; // fallback to first child
}

export function getSessionsByChildId(childId: string) {
  return mockSessions.filter((session) => session.childId === childId);
}

export function getTranscriptBySessionId(sessionId: string) {
  return mockTranscripts.filter((msg) => msg.sessionId === sessionId);
}

export function getEmotionEventsByChildId(childId: string) {
  return mockEmotions.filter((event) => event.childId === childId);
}

export function getAlertsByChildId(childId: string) {
  return mockAlerts.filter((alert) => alert.childId === childId);
}

export function getLessonsByChildId(childId: string) {
  // Currently mock lessons are global, but this could be filtered by child's grade/preferences
  void childId;
  return mockLessons;
}

export function getRoutinesByChildId(childId: string) {
  return mockRoutines.filter((routine) => routine.childId === childId);
}
