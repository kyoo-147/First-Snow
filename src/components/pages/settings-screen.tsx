"use client";

import Link from "next/link";
import { Bell, ChevronRight, Database, KeyRound, Lock, Phone, Shield, UserCircle } from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";

const destinations = [
  { href: "/parent/settings/account", title: "Parent account", detail: "Update your guardian name or change your password.", icon: UserCircle },
  { href: "/parent/consent", title: "Consent and device access", detail: "Review stored guardian consent for microphone, camera, vision, and screen access.", icon: Shield },
  { href: "/parent/privacy", title: "Privacy and data", detail: "Review retention, export, and deletion requests with their real processing status.", icon: Database },
  { href: "/parent/settings/emergency", title: "Emergency contacts", detail: "Manage parent-only contacts used for safety follow-up.", icon: Phone },
  { href: "/parent/settings/notifications", title: "Notification preferences", detail: "Review which notification preferences can currently be stored.", icon: Bell },
] as const;

export function SettingsScreen() {
  return (
    <ParentPageFrame>
      <PageHeader eyebrow="Parent controls" title="Settings, privacy, and safety" description="Open a dedicated settings area to review server-backed information and make supported changes." />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsSection title="Settings areas" description="Each area reports loading, saved, unavailable, and failed states directly from the service.">
          <div className="divide-y divide-snow-border overflow-hidden rounded-[var(--radius-md)] border border-snow-border">
            {destinations.map(({ href, title, detail, icon: Icon }) => (
              <Link key={href} href={href} className="snow-focus-ring flex items-center gap-4 bg-snow-surface px-4 py-4 transition hover:bg-snow-surface-soft active:translate-y-px">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-primary-soft"><Icon className="size-5 text-snow-primary" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-snow-primary-dark">{title}</span><span className="snow-body-small snow-font-readable mt-1 block font-semibold text-snow-muted">{detail}</span></span>
                <ChevronRight className="size-4 shrink-0 text-snow-muted" />
              </Link>
            ))}
          </div>
        </SettingsSection>
        <aside className="space-y-4">
          <SnowCard className="snow-card-pad bg-snow-lavender">
            <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface"><Lock className="size-5 text-snow-primary" /></div><div><h2 className="text-lg font-black text-snow-primary-dark">Parent-only controls</h2><p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-primary-dark">Child sessions cannot read or change guardian account, privacy, notification, or emergency settings.</p></div></div>
          </SnowCard>
          <SettingsSection title="Not available yet">
            <Unavailable label="Email verification" />
            <Unavailable label="Multi-factor authentication" />
            <Unavailable label="Device and session management" />
          </SettingsSection>
          <Link href="/parent/settings/account" className="snow-focus-ring flex items-center justify-between rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 transition hover:bg-snow-surface-soft">
            <span><span className="block text-sm font-black text-snow-primary-dark">Security settings</span><span className="mt-1 block text-xs font-semibold text-snow-muted">Password change and session revocation</span></span><KeyRound className="size-5 text-snow-primary" />
          </Link>
        </aside>
      </div>
    </ParentPageFrame>
  );
}

function Unavailable({ label }: { label: string }) {
  return <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3"><span className="text-sm font-bold text-snow-primary-dark">{label}</span><span className="text-xs font-black text-snow-muted">Unavailable</span></div>;
}
