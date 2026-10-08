"use client";
import { t } from "@/i18n";

import Link from "next/link";
import { Bell, ChevronRight, Database, KeyRound, Lock, Phone, Shield, UserCircle } from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";

const destinations = [
  { href: "/parent/settings/account", title: t("parent", "nav.account"), detail: t("parent", "settingsScreen.accountDesc"), icon: UserCircle },
  { href: "/parent/consent", title: t("parent", "nav.consent"), detail: t("parent", "settingsScreen.consentDesc"), icon: Shield },
  { href: "/parent/privacy", title: t("parent", "nav.privacy"), detail: t("parent", "settingsScreen.privacyDesc"), icon: Database },
  { href: "/parent/settings/emergency", title: t("parent", "nav.emergency"), detail: t("parent", "settingsScreen.emergencyDesc"), icon: Phone },
  { href: "/parent/settings/notifications", title: t("parent", "nav.notifications"), detail: t("parent", "settingsScreen.notificationsDesc"), icon: Bell },
] as const;

export function SettingsScreen() {
  return (
    <ParentPageFrame>
      <PageHeader eyebrow={t("parent", "settingsScreen.eyebrow")} title={t("parent", "settings.title")} description={t("parent", "settings.desc")} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsSection title={t("parent", "settings.areas")} description={t("parent", "settings.areasDesc")}>
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
            <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface"><Lock className="size-5 text-snow-primary" /></div><div><h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "settings.parentOnly")}</h2><p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-primary-dark">{t("parent", "settings.parentOnlyDesc")}</p></div></div>
          </SnowCard>
          <SettingsSection title={t("parent", "settings.notAvailable")}>
            <Unavailable label={t("parent", "settings.emailVerify")} />
            <Unavailable label={t("parent", "settings.mfa")} />
            <Unavailable label={t("parent", "settings.deviceMgmt")} />
          </SettingsSection>
          <Link href="/parent/settings/account" className="snow-focus-ring flex items-center justify-between rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 transition hover:bg-snow-surface-soft">
            <span><span className="block text-sm font-black text-snow-primary-dark">{t("parent", "settings.security")}</span><span className="mt-1 block text-xs font-semibold text-snow-muted">{t("parent", "settings.securityDesc")}</span></span><KeyRound className="size-5 text-snow-primary" />
          </Link>
        </aside>
      </div>
    </ParentPageFrame>
  );
}

function Unavailable({ label }: { label: string }) {
  return <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3"><span className="text-sm font-bold text-snow-primary-dark">{label}</span><span className="text-xs font-black text-snow-muted">{t("parent", "settings.unavailable")}</span></div>;
}
