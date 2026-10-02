"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, Camera, ChevronRight, Download, Eye, Heart, Lock, Mic, Phone, Shield, Trash2, VideoOff, type LucideIcon } from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import { SettingsRightRail } from "@/components/app-shell/right-rail";
import { getChildById } from "@/data";
import { cn } from "@/lib/utils";

const privacySections = [
  {
    title: "Camera and mic access",
    desc: "Control which session tools are available during AgentKid conversations.",
    items: [
      { label: "Microphone access", value: "Allowed", type: "toggle", enabled: true },
      { label: "Camera access", value: "Off by default", type: "toggle", enabled: false },
      { label: "Camera preview", value: "Always hidden unless parent turns it on", type: "status" },
    ],
  },
  {
    title: "Vision AI",
    desc: "Decide whether AgentKid can use visual understanding during supported sessions.",
    items: [
      { label: "Vision AI access", value: "Off", type: "toggle", enabled: false },
      { label: "Visual session review", value: "Parent-only control", type: "status" },
    ],
  },
  {
    title: "Transcript and emotion storage",
    desc: "Choose how long session records remain available for parent review.",
    items: [
      { label: "Transcript storage", value: "30 days", type: "link" },
      { label: "Emotion timeline storage", value: "Enabled for parent history", type: "toggle", enabled: true },
      { label: "Consent review", value: "No pending changes", type: "link" },
    ],
  },
  {
    title: "Emergency contacts and alerts",
    desc: "Parent-only settings for urgent follow-up and calm-support escalation.",
    items: [
      { label: "Emergency contacts", value: "2 contacts saved", type: "link", parentOnly: true },
      { label: "Emergency alert settings", value: "Parent-only", type: "link", parentOnly: true },
      { label: "Notification preferences", value: "Push and email enabled", type: "link" },
    ],
  },
  {
    title: "Data controls",
    desc: "Review export, deletion, and privacy ownership choices.",
    items: [
      { label: "Export child data", value: "Download archive", type: "link" },
      { label: "Delete stored records", value: "Review before delete", type: "danger" },
    ],
  },
];

export function SettingsScreen() {
  const child = getChildById("minh");
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({
    "Microphone access": true,
    "Camera access": false,
    "Vision AI access": false,
    "Emotion timeline storage": true,
  });

  const profileRows = [
    { label: "Child", value: child.name },
    { label: "Age", value: `${child.age} years old` },
    { label: "Grade", value: child.grade },
    { label: "Comfort style", value: "Short prompts and slower transitions" },
  ];

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Parent controls"
        title="Settings, privacy, and safety"
        description={`Calm, clear controls for how AgentKid stores information, uses device access, and supports ${child.name} during sessions.`}
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 min-w-0">
        <SnowCard className="snow-card-pad">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Image src={child.avatarUrl || "/images/snow-avatar-final.png"} alt={child.name} width={72} height={72} className="rounded-full bg-snow-ice object-cover" />
              <div>
                <h2 className="snow-heading font-black text-snow-primary-dark">Child profile</h2>
                <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">Primary child account currently managed in AgentKid.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {profileRows.map((row) => (
                <div key={row.label} className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">{row.label}</p>
                  <p className="mt-1 text-sm font-black text-snow-primary-dark">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </SnowCard>

        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading font-black text-snow-primary-dark">Today&apos;s privacy status</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            <StatusPill icon={VideoOff} title="Camera preview" value="Off by default" />
            <StatusPill icon={Mic} title="Microphone" value="Available when a session starts" />
            <StatusPill icon={Eye} title="Vision AI" value="Off" />
            <StatusPill icon={Heart} title="Emotion timeline" value="Stored for parent review" />
          </div>
        </SnowCard>

        {privacySections.map((section) => (
          <SettingsSection key={section.title} title={section.title} description={section.desc}>
              {section.items.map((item) => (
                <SettingRow
                  key={item.label}
                  {...item}
                  enabled={item.type === "toggle" ? (toggleValues[item.label] ?? Boolean(item.enabled)) : item.enabled}
                  onToggle={() =>
                    setToggleValues((current) => ({
                      ...current,
                      [item.label]: !(current[item.label] ?? Boolean(item.enabled)),
                    }))
                  }
                />
              ))}
          </SettingsSection>
        ))}

        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading font-black text-snow-primary-dark">Parent-only reminders</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-snow-lavender px-4 py-3">
              <p className="text-sm font-black text-snow-primary-dark">Emergency alert settings stay parent-only.</p>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-primary-dark">Children never see or change these controls during everyday use.</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3">
              <p className="text-sm font-black text-snow-primary-dark">Consent review is available before any storage change.</p>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">AgentKid keeps the wording simple so guardians can make calm, clear choices.</p>
            </div>
          </div>
        </SnowCard>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Need help?", "We are here for you and your family."],
            ["Help Center", "Answers to common questions."],
            ["Contact Support", "Get a calm response from AgentKid support."],
            ["Share Feedback", "Tell us what would help next."],
          ].map(([title, detail], index) => (
            <SnowCard key={title} className={cn("p-5", index === 0 && "bg-snow-lavender")}>
              <p className="text-base font-black text-snow-primary-dark">{title}</p>
              <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">{detail}</p>
            </SnowCard>
          ))}
        </div>
        </div>
        <aside className="space-y-4">
          <SnowCard className="snow-card-pad bg-snow-lavender">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-snow-primary-dark">Safety priority</h2>
                <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-primary-dark">
                  Privacy, camera, alerts, and data controls stay parent-only.
                </p>
              </div>
            </div>
          </SnowCard>
          <SettingsRightRail />
        </aside>
      </div>
    </ParentPageFrame>
  );
}

type SettingRowProps = {
  label: string;
  value: string;
  type: "toggle" | "status" | "link" | "danger";
  enabled?: boolean;
  parentOnly?: boolean;
  onToggle?: () => void;
};

function SettingRow({ label, value, type, enabled = false, parentOnly = false, onToggle }: SettingRowProps) {
  const iconMap: Record<string, LucideIcon> = {
    "Microphone access": Mic,
    "Camera access": Camera,
    "Camera preview": VideoOff,
    "Vision AI access": Eye,
    "Visual session review": Eye,
    "Transcript storage": Download,
    "Emotion timeline storage": Heart,
    "Consent review": Lock,
    "Emergency contacts": Phone,
    "Emergency alert settings": Bell,
    "Notification preferences": Bell,
    "Export child data": Download,
    "Delete stored records": Trash2,
  };
  const Icon = iconMap[label] ?? Shield;

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-snow-border px-4 py-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface-soft">
        <Icon className="size-4 text-snow-primary-dark" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-snow-primary-dark">{label}</p>
          {parentOnly ? <span className="rounded-full bg-snow-primary-soft px-2 py-0.5 text-[10px] font-black text-snow-primary">Parent-only</span> : null}
        </div>
        <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{value}</p>
      </div>
      {type === "toggle" ? (
        <button
          type="button"
          aria-label={`Toggle ${label}`}
          aria-pressed={enabled}
          onClick={onToggle}
          className={`snow-focus-ring relative h-6 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-snow-success" : "bg-snow-border"}`}
        >
          <div className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      ) : type === "danger" ? (
        <span className="text-xs font-black text-snow-danger">Review</span>
      ) : type === "status" ? (
        <span className="text-xs font-black text-snow-muted">Info</span>
      ) : (
        <ChevronRight className="size-4 shrink-0 text-snow-muted" />
      )}
    </div>
  );
}

function StatusPill({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
      <div className="grid size-9 place-items-center rounded-full bg-snow-surface">
        <Icon className="size-4 text-snow-primary" />
      </div>
      <div>
        <p className="text-sm font-black text-snow-primary-dark">{title}</p>
        <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">{value}</p>
      </div>
    </div>
  );
}
