"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";
import { parentNavGroups } from "@/data/snow-data";
import { SnowLogo } from "@/components/ui/snow-logo";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "agentkid:parent-sidebar-collapsed";

export function ParentShell({
  activeNav,
  children,
}: {
  activeNav: string;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const frame = window.requestAnimationFrame(() => {
      setIsCollapsed(stored === null ? window.innerWidth < 1200 : stored === "true");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  const showLabels = !isCollapsed || isMobileMenuOpen;

  return (
    <div className="snow-page-bg h-[100dvh] overflow-hidden text-snow-foreground">
      <div className="flex h-full overflow-hidden bg-snow-surface">
        {isMobileMenuOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          aria-label="Parent sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-snow-border bg-snow-surface transition-[width,transform] duration-200 ease-out md:static md:translate-x-0",
            isMobileMenuOpen ? "w-[224px] translate-x-0" : "w-[224px] -translate-x-full",
            isCollapsed ? "md:w-[66px]" : "md:w-[224px]",
          )}
        >
          <div className={cn("flex h-[72px] shrink-0 items-center border-b border-snow-border px-4", isCollapsed && !isMobileMenuOpen && "md:justify-center md:px-0")}>
            <Link href="/parent" aria-label="Go to AgentKid dashboard" className={cn("snow-focus-ring rounded-[var(--radius-md)]", isCollapsed && !isMobileMenuOpen && "md:hidden")}>
              <SnowLogo />
            </Link>
            <button
              type="button"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleSidebar}
              className={cn(
                "snow-focus-ring hidden size-8 shrink-0 place-items-center rounded-[var(--radius-md)] border border-transparent text-snow-muted transition hover:border-snow-border hover:bg-snow-surface-soft hover:text-snow-primary-dark md:grid",
                isCollapsed && !isMobileMenuOpen ? "mx-auto" : "ml-auto",
              )}
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="snow-focus-ring ml-auto grid size-8 place-items-center rounded-[var(--radius-md)] text-snow-muted transition hover:bg-snow-surface-soft hover:text-snow-foreground md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <nav aria-label="Parent navigation" className="agentkid-nav-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-5">
              {parentNavGroups.map((group) => (
                <section key={group.group} aria-label={group.group}>
                  <p className={cn("mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-snow-muted transition-opacity", !showLabels && "md:sr-only")}>
                    {group.group}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeNav === item.key;

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          title={!showLabels ? item.label : undefined}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "snow-focus-ring relative flex h-9 items-center rounded-[var(--radius-md)] text-[13px] transition-colors duration-150",
                            showLabels ? "gap-3 px-2.5" : "md:justify-center md:px-0",
                            active
                              ? "agentkid-nav-active bg-snow-primary-soft text-snow-primary"
                              : "font-medium text-snow-muted hover:bg-snow-surface-soft hover:text-snow-foreground",
                          )}
                        >
                          <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                          <span className={cn("truncate whitespace-nowrap", !showLabels && "md:hidden")}>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className="shrink-0 border-t border-snow-border p-2">
            <Link
              href="/parent/settings/account"
              title={!showLabels ? "Account" : undefined}
              className={cn(
                "snow-focus-ring flex min-h-11 items-center rounded-[var(--radius-md)] transition hover:bg-snow-surface-soft",
                showLabels ? "gap-3 px-2" : "md:justify-center md:px-0",
                activeNav === "account" && "bg-snow-primary-soft",
              )}
            >
              <Image src="/images/nana_avatar.png" alt="" width={30} height={30} className="size-[30px] shrink-0 rounded-[var(--radius-md)] object-cover" />
              <span className={cn("min-w-0 flex-1", !showLabels && "md:hidden")}>
                <strong className="block truncate text-[13px] font-semibold text-snow-foreground">Linh Nguyen</strong>
                <span className="block truncate text-[11px] text-snow-muted">Parent account</span>
              </span>
              <ChevronRight className={cn("size-4 shrink-0 text-snow-muted", !showLabels && "md:hidden")} />
            </Link>
          </div>
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-snow-border bg-snow-surface px-4 py-2 sm:px-5 lg:px-6">
            <div className="flex items-center gap-3 md:hidden">
              <button
                type="button"
                aria-label="Open navigation menu"
                className="snow-focus-ring grid size-10 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark hover:bg-snow-surface-soft"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="size-5" />
              </button>
              <SnowLogo />
            </div>
            <div className="hidden md:block" />
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/session/home" className="snow-focus-ring hidden min-h-11 items-center gap-2 rounded-full bg-snow-primary px-5 text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition hover:brightness-105 lg:inline-flex">
                Open Minh&apos;s app <Sparkles className="size-4" />
              </Link>
              <Link href="/parent/alerts" aria-label="Open parent alerts" className="snow-focus-ring grid size-10 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark">
                <Bell className="size-5" />
              </Link>
              <Link href="/parent/settings/account" className="snow-focus-ring hidden min-h-[52px] items-center gap-3 rounded-full border border-snow-border bg-snow-surface px-3 shadow-[var(--shadow-card)] md:flex">
                <Image src="/images/nana_avatar.png" alt="" width={40} height={40} className="rounded-full object-cover" />
                <span className="text-sm leading-tight">
                  <strong className="block font-black text-snow-primary-dark">Linh Nguyen</strong>
                  <span className="font-bold text-snow-muted">Parent</span>
                </span>
                <ChevronDown className="size-4 text-snow-primary-dark" />
              </Link>
              <Link href="/session/home" aria-label="Open Minh's child app" className="snow-focus-ring flex min-h-[52px] min-w-0 items-center gap-3 rounded-full border border-snow-border bg-snow-primary-soft px-3 shadow-[var(--shadow-card)]">
                <Image src="/images/snow-avatar-final.png" alt="" width={40} height={40} className="rounded-full object-cover" />
                <span className="hidden text-sm leading-tight sm:block">
                  <strong className="block font-black text-snow-primary-dark">Minh</strong>
                  <span className="font-bold text-snow-muted">Open child app</span>
                </span>
              </Link>
            </div>
          </header>

          <div className="snow-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-5 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
