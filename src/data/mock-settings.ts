import type { PrivacySettings, NotificationSettings, EmergencyContact } from "@/types/snow";

export const mockPrivacySettings: PrivacySettings = {
  microphoneAccess: true,
  cameraAccess: false,
  visionAiAccess: false,
  transcriptStorageDays: 30,
  emotionTimelineStorage: true,
};

export const mockNotificationSettings: NotificationSettings = {
  emailAlerts: true,
  pushAlerts: true,
  weeklyReport: true,
};

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: "contact-1",
    name: "Sarah Nguyen",
    relation: "Mother",
    phone: "555-0101",
  },
  {
    id: "contact-2",
    name: "David Nguyen",
    relation: "Father",
    phone: "555-0102",
  }
];
