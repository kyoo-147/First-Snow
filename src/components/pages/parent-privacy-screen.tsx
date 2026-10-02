"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Camera, Download, Eye, FileCheck, Heart, Mic, Shield, Trash2, VideoOff } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { mockPrivacySettings } from "@/data";
import { cn } from "@/lib/utils";

type PrivacyRow = {
  key: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  kind: "toggle" | "status";
  enabled?: boolean;
  value?: string;
};

const initialRows: PrivacyRow[] = [
  { key: "microphoneAccess", title: "Microphone access", detail: "Available only after a child starts a AgentKid session.", icon: Mic, kind: "toggle", enabled: mockPrivacySettings.microphoneAccess },
  { key: "cameraAccess", title: "Camera access", detail: "Parent-controlled and off by default.", icon: Camera, kind: "toggle", enabled: mockPrivacySettings.cameraAccess },
  { key: "cameraPreview", title: "Camera preview", detail: "Hidden unless a parent explicitly turns preview on.", icon: VideoOff, kind: "status", enabled: false },
  { key: "visionAiAccess", title: "Vision AI", detail: "Visual understanding is off for everyday sessions.", icon: Eye, kind: "toggle", enabled: mockPrivacySettings.visionAiAccess },
  { key: "transcriptStorage", title: "Transcript storage", detail: `Conversation records remain available for ${mockPrivacySettings.transcriptStorageDays} days.`, icon: FileCheck, kind: "status", value: `${mockPrivacySettings.transcriptStorageDays} days` },
  { key: "emotionTimelineStorage", title: "Emotion timeline", detail: "Stored for parent review using observation language.", icon: Heart, kind: "toggle", enabled: mockPrivacySettings.emotionTimelineStorage },
];

export function ParentPrivacyScreen() {
  const [rows, setRows] = useState(initialRows);

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Privacy"
        title="Privacy and data controls"
        description="Review device access, transcript storage, emotion timeline storage, and data ownership. Children cannot change these settings."
        action={
          <SnowButton>
            <Shield className="mr-2 size-4" />
            Save review
          </SnowButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Camera preview" value="Off" detail="Hidden by default" icon={<VideoOff className="size-5 text-snow-primary" />} />
        <StatusTile label="Vision AI" value="Off" detail="Parent-controlled" icon={<Eye className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Consent" value="Current" detail="No pending changes" icon={<FileCheck className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection title="Access and storage" description="Each row explains what AgentKid can use and where the parent can review it.">
          {rows.map((row) => {
            const Icon = row.icon;
            const enabled = "enabled" in row ? row.enabled : false;

            return (
              <div key={row.key} className="flex items-center gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-snow-primary-dark">{row.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{row.detail}</p>
                </div>
                {row.kind === "toggle" ? (
                  <button
                    type="button"
                    aria-label={`Toggle ${row.title}`}
                    aria-pressed={enabled}
                    onClick={() => setRows((current) => current.map((item) => item.key === row.key ? { ...item, enabled: !enabled } : item))}
                    className={cn("snow-focus-ring relative h-6 w-12 shrink-0 rounded-full transition-colors", enabled ? "bg-snow-success" : "bg-snow-border")}
                  >
                    <span className={cn("absolute top-1 size-4 rounded-full bg-white transition-transform", enabled ? "translate-x-7" : "translate-x-1")} />
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                    {"value" in row ? row.value : "Hidden"}
                  </span>
                )}
              </div>
            );
          })}
        </SettingsSection>

        <aside className="space-y-4">
          <SettingsSection title="Data ownership">
            <button className="snow-focus-ring snow-interactive-card flex w-full items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-left text-sm font-black text-snow-primary-dark">
              <span className="flex items-center gap-3"><Download className="size-4 text-snow-primary" /> Export child data</span>
              <span className="text-xs text-snow-muted">Archive</span>
            </button>
            <button className="snow-focus-ring snow-interactive-card flex w-full items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-left text-sm font-black text-snow-danger">
              <span className="flex items-center gap-3"><Trash2 className="size-4" /> Review delete request</span>
              <span className="text-xs text-snow-muted">Parent-only</span>
            </button>
          </SettingsSection>
          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Calm copy rule</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Parent screens describe what AgentKid observed. They avoid labels and clinical-style scoring.</p>
          </div>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
