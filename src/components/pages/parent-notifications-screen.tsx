"use client";

import { BellRing, Mail, MessageSquare, Smartphone } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { mockNotificationSettings } from "@/data";

const channels = [
  { title: "Email alerts", detail: "Parent receives weekly summaries and important review prompts.", enabled: mockNotificationSettings.emailAlerts, icon: Mail },
  { title: "Push alerts", detail: "Parent device receives time-sensitive review prompts.", enabled: mockNotificationSettings.pushAlerts, icon: Smartphone },
  { title: "Weekly report", detail: "A calm summary of sessions, routines, and parent-only safety status.", enabled: mockNotificationSettings.weeklyReport, icon: MessageSquare },
];

export function ParentNotificationsScreen() {
  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Settings"
        title="Notifications"
        description="Control how parent-only summaries, alert reviews, and routine reminders are delivered."
        action={<SnowButton variant="soft">Save preferences</SnowButton>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Email" value={mockNotificationSettings.emailAlerts ? "On" : "Off"} detail="Weekly and alert summaries" icon={<Mail className="size-5 text-snow-primary" />} />
        <StatusTile label="Push" value={mockNotificationSettings.pushAlerts ? "On" : "Off"} detail="Parent device only" icon={<Smartphone className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Report cadence" value="Weekly" detail="Every Friday" icon={<BellRing className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <SettingsSection title="Notification channels" description="No notification settings are shown inside the child session flow.">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div key={channel.title} className="flex items-center gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-snow-primary">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-snow-primary-dark">{channel.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{channel.detail}</p>
              </div>
              <div className={`relative h-6 w-11 rounded-full ${channel.enabled ? "bg-snow-primary" : "bg-snow-border"}`}>
                <div className={`absolute top-1 size-4 rounded-full bg-white ${channel.enabled ? "right-1" : "left-1"}`} />
              </div>
            </div>
          );
        })}
      </SettingsSection>
    </ParentPageFrame>
  );
}
