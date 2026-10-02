import type { AdminCompanionSettings } from "@/types/snow";

export const mockAdminSettings: AdminCompanionSettings = {
  live2dModel: "Snow_v2_optimized.moc3",
  asrProvider: "VAD Web + Whisper",
  ttsProvider: "ElevenLabs (Snow_Custom_Voice)",
  llmProvider: "GPT-4o (Fine-tuned for early childhood)",
  systemPrompt: "You are AgentKid, a calm, gentle AI companion for a child...",
};

export const mockAdminStats = {
  activeSessions: 124,
  connectedUsers: 85,
  avgLatencyMs: 240,
  serverUptime: "14 days, 5 hours",
  memoryUsage: "45%",
};
