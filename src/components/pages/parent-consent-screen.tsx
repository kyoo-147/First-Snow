"use client";

import { CheckCircle2, Eye, FileCheck, Heart, Lock, Mic } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";

const consentRows = [
  { title: "Microphone during sessions", detail: "Allowed when Minh starts a AgentKid conversation.", status: "Reviewed", icon: Mic },
  { title: "Transcript storage", detail: "Stored for parent review for the current retention window.", status: "Reviewed", icon: FileCheck },
  { title: "Emotion timeline storage", detail: "Used to show parent-facing observation history.", status: "Reviewed", icon: Heart },
  { title: "Vision AI access", detail: "Off unless a parent enables it for a supported session.", status: "Off", icon: Eye },
  { title: "Data export and delete", detail: "Parent can request archive or deletion from privacy controls.", status: "Available", icon: Lock },
];

export function ParentConsentScreen() {
  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Consent"
        title="Consent review"
        description="Review what AgentKid is allowed to use, store, and show in parent summaries. Consent changes stay parent-only."
        action={<SnowButton variant="soft">Download consent summary</SnowButton>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Consent state" value="Current" detail="No pending changes" icon={<FileCheck className="size-5 text-snow-primary" />} />
        <StatusTile label="Vision AI" value="Off" detail="Requires parent review" icon={<Eye className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Child controls" value="Hidden" detail="Parent-only route" icon={<Lock className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection title="Consent items" description="Each item uses clear guardian-facing language.">
          {consentRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.title} className="flex items-center gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-snow-primary-dark">{row.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{row.detail}</p>
                </div>
                <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">{row.status}</span>
              </div>
            );
          })}
        </SettingsSection>

        <SettingsSection title="Review checklist">
          {["Camera preview remains off by default.", "Emergency alert settings remain parent-only.", "Parent summaries use observation language."].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3">
              <CheckCircle2 className="size-4 shrink-0 text-snow-success" />
              <span className="text-sm font-bold leading-6 text-snow-primary-dark">{item}</span>
            </div>
          ))}
        </SettingsSection>
      </div>
    </ParentPageFrame>
  );
}
