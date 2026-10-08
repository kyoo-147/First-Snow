"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  Lock,
  Settings,
} from "lucide-react";
import { topNavItems } from "@/data/snow-data";
import { SnowLogo } from "@/components/ui/snow-logo";
import { cn } from "@/lib/utils";
import { fetchDashboardSession } from "@/lib/dashboard-client";
import { t } from "@/i18n";

type AppShellProps = {
  activeNav:
    | "home"
    | "lessons"
    | "companion"
    | "activities"
    | "routine"
    | "library"
    | "progress"
    | "settings"
    | "explore"
    | "rewards"
    | "create";
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  backHref?: string;
};

export function AppShell({ activeNav, children, rightPanel, backHref }: AppShellProps) {
  const [childName, setChildName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardSession()
      .then((session) => {
        if (!cancelled && session?.actorType === "child") setChildName(session.child.name);
      })
      .catch(() => {
        if (!cancelled) setChildName(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="snow-page-bg h-[100dvh] overflow-hidden text-snow-foreground">
      <div className="flex h-full w-full overflow-hidden bg-snow-surface/82 backdrop-blur">
        <main className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-snow-border/55 bg-snow-surface/72 px-4 py-2 backdrop-blur-xl sm:px-5 lg:px-6">
            <div className="flex min-w-[140px] items-center gap-3">
              {backHref && (
                <Link aria-label={t("common", "back")} href={backHref} className="snow-focus-ring md:hidden grid size-10 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark hover:bg-snow-surface-soft">
                  <ChevronLeft className="size-5" />
                </Link>
              )}
              <Link href="/session/home" aria-label={t("common", "back")} className={cn("snow-focus-ring rounded-lg", backHref ? "hidden md:block" : "block")}>
                <SnowLogo />
              </Link>
            </div>
            <nav aria-label={t("common", "search")} className="hidden flex-1 items-center justify-center gap-7 md:flex">
                {topNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.key || (activeNav === "activities" && item.key === "feelings");
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "snow-focus-ring grid min-w-14 place-items-center gap-1 text-[11px] font-bold transition",
                        active ? "text-snow-primary" : "text-snow-primary-dark",
                      )}
                    >
                      <span className={cn("grid size-8 place-items-center rounded-full", active && "bg-snow-primary-soft")}>
                        <Icon className="size-[17px]" />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:w-auto md:justify-end md:gap-3">
              <Link href="/parent" className="snow-focus-ring hidden min-h-11 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-extrabold text-snow-primary-dark transition hover:bg-snow-surface-soft md:inline-flex">
                {t("auth", "sessionSwitch.view.guardianPortal")} <Lock className="size-4" />
              </Link>
              <Link
                href="/session-switch"
                aria-label={t("parent", "child.addChild")}
                title={t("parent", "child.addChild")}
                className="snow-focus-ring hidden min-h-11 items-center gap-1.5 rounded-full border border-snow-border bg-snow-surface px-3 text-xs font-bold text-snow-muted transition hover:bg-snow-surface-soft hover:text-snow-primary-dark lg:inline-flex"
              >
                {t("auth", "sessionSwitch.view.switchChild")}
              </Link>
              <Link href="/session/activities" aria-label={t("common", "learnMore")} className="snow-focus-ring grid size-10 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark transition hover:bg-snow-surface-soft">
                <Bell className="size-5" />
              </Link>
              <Link href="/session/settings" aria-label={t("common", "settings")} className="snow-focus-ring flex min-h-12 min-w-0 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-2 shadow-[var(--shadow-card)] transition hover:bg-snow-surface-soft sm:min-h-[52px] sm:gap-3 sm:px-3">
                <Image src="/images/snow-avatar-final.png" alt="" width={40} height={40} className="rounded-full object-cover" />
                <span className="hidden text-sm leading-tight sm:block">
                  <strong className="block font-black text-snow-primary-dark">{childName ?? t("common", "childProfile")}</strong>
                  <span className="font-bold text-snow-muted">{ t("common", "success") }</span>
                </span>
                <Settings className="hidden size-4 text-snow-muted sm:block" />
              </Link>
            </div>
          </header>

          <div className={cn("snow-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-0 md:pb-5 sm:px-5 lg:px-6", rightPanel && "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]")}>
            <div className="min-w-0 pt-4 md:pt-0">{children}</div>
            {rightPanel ? <aside className="hidden lg:block pt-4 md:pt-0">{rightPanel}</aside> : null}
          </div>

          <nav aria-label={t("common", "search")} className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-snow-border bg-white/90 backdrop-blur-xl pb-safe pt-1 md:hidden">
              {topNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.key || (activeNav === "activities" && item.key === "feelings");
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "snow-focus-ring flex min-w-[64px] flex-col items-center justify-center gap-1 transition-colors",
                      active ? "text-snow-primary" : "text-snow-muted hover:text-snow-primary-dark"
                    )}
                  >
                    <div className={cn("grid size-9 place-items-center rounded-full transition-colors", active && "bg-snow-primary-soft")}>
                      <Icon className="size-[22px]" />
                    </div>
                    <span className={cn("text-[11px] font-bold", active && "text-snow-primary-dark")}>{item.label}</span>
                  </Link>
                );
              })}
          </nav>
        </main>
      </div>
    </div>
  );
}
