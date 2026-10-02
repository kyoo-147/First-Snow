import type { EmotionEvent } from "@/types/snow";

export const mockEmotions: EmotionEvent[] = [
  {
    id: "emotion-1",
    childId: "minh",
    sessionId: "session-1",
    emotion: "frustrated",
    timestamp: "2026-06-14T09:31:00.000Z",
    note: "Started feeling frustrated during math exercise",
  },
  {
    id: "emotion-2",
    childId: "minh",
    sessionId: "session-1",
    emotion: "calm",
    timestamp: "2026-06-14T09:36:00.000Z",
    note: "Regained calmness after breathing exercise",
  },
  {
    id: "emotion-3",
    childId: "mai-nguyen",
    sessionId: "session-3",
    emotion: "happy",
    timestamp: "2026-06-15T12:36:00.000Z",
    note: "Enjoyed the bedtime story",
  }
];
