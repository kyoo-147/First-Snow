import type { TranscriptMessage } from "@/types/snow";

export const mockTranscripts: TranscriptMessage[] = [
  {
    id: "msg-1",
    sessionId: "session-1",
    speaker: "snow",
    text: "Hi Minh! How are you feeling today?",
    timestamp: "2026-06-14T09:30:00.000Z",
  },
  {
    id: "msg-2",
    sessionId: "session-1",
    speaker: "child",
    text: "I am a bit tired...",
    timestamp: "2026-06-14T09:30:10.000Z",
  },
  {
    id: "msg-3",
    sessionId: "session-1",
    speaker: "snow",
    text: "That's completely okay. We can take it slow. Would you like to do a quick breathing exercise?",
    timestamp: "2026-06-14T09:30:20.000Z",
  }
];
