import type { Alert } from "@/types/snow";

export const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    childId: "minh",
    title: "Session Duration Alert",
    description: "Minh has been practicing for over 45 minutes today.",
    severity: "low",
    date: "2026-06-15T10:00:00.000Z",
    isRead: false,
  },
  {
    id: "alert-2",
    childId: "minh",
    title: "New Emotion Milestone",
    description: "Minh independently recognized feeling 'frustrated' and asked for a calming exercise.",
    severity: "medium",
    date: "2026-06-14T10:00:00.000Z",
    isRead: true,
  }
];
