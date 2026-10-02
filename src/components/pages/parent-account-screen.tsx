"use client";

import { Mail, ShieldCheck, UserCircle } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";

export function ParentAccountScreen() {
  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Account"
        title="Parent account"
        description="Manage guardian profile details, protected access, and the selected child context for AgentKid."
        action={<SnowButton variant="soft">Save account</SnowButton>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Guardian" value="Linh Nguyen" detail="Primary parent" icon={<UserCircle className="size-5 text-snow-primary" />} />
        <StatusTile label="Email" value="Verified" detail="parent@example.com" icon={<Mail className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Access" value="Protected" detail="Parent Access required" icon={<ShieldCheck className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection title="Profile details" description="These details are visible only in the parent portal.">
          <label className="block">
            <span className="text-sm font-black text-snow-primary-dark">Display name</span>
            <input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 text-sm font-semibold text-snow-primary-dark outline-none focus:border-snow-primary" value="Linh Nguyen" readOnly />
          </label>
          <label className="block">
            <span className="text-sm font-black text-snow-primary-dark">Email</span>
            <input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 text-sm font-semibold text-snow-primary-dark outline-none focus:border-snow-primary" value="parent@example.com" readOnly />
          </label>
          <label className="block">
            <span className="text-sm font-black text-snow-primary-dark">Selected child</span>
            <input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 text-sm font-semibold text-snow-primary-dark outline-none focus:border-snow-primary" value="Minh, age 8" readOnly />
          </label>
        </SettingsSection>

        <SettingsSection title="Access reminders">
          {["Parent Access protects privacy and safety controls.", "Child sessions do not show account or emergency settings.", "Account changes should be reviewed with another guardian when needed."].map((item) => (
            <div key={item} className="rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-sm font-bold leading-6 text-snow-primary-dark">{item}</div>
          ))}
        </SettingsSection>
      </div>
    </ParentPageFrame>
  );
}
