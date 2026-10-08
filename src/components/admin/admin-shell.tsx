"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Cpu, Menu, ShieldCheck, X } from "lucide-react";
import { SnowLogo } from "@/components/ui/snow-logo";
import { cn } from "@/lib/utils";

import { t } from "@/i18n";

const adminNavItems = [
  { key: "dashboard", label: t("parent", "admin.nav.overview"), href: "/admin", icon: ShieldCheck },
  { key: "companion", label: t("parent", "admin.nav.companion"), href: "/admin/companion", icon: Bot },
  { key: "vision", label: t("parent", "admin.nav.vision"), href: "/admin/vision", icon: Cpu },
  { key: "system", label: t("parent", "admin.nav.system"), href: "/admin/system", icon: Cpu },
];

export function AdminShell({ children, activeNav = "dashboard" }: { children: React.ReactNode; activeNav?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="snow-page-bg h-[100dvh] overflow-hidden">
      <div className="flex h-full overflow-hidden bg-snow-surface/88">
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-[240px] shrink-0 flex-col overflow-hidden border-r border-snow-border bg-snow-surface/94 px-4 py-5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
            isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <SnowLogo />
            <button
              aria-label={t("parent", "admin.aria.closeAdminNav")}
              className="lg:hidden text-snow-muted hover:text-snow-primary-dark"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="mt-8 flex-1 overflow-y-auto snow-scrollbar">
            <h2 className="px-4 text-xs font-black uppercase tracking-wider text-snow-muted">{t("parent", "admin.portal")}</h2>
            <nav className="mt-4 space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "snow-focus-ring flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] px-4 text-sm font-bold transition",
                      activeNav === item.key ? "bg-snow-primary-soft text-snow-primary" : "text-snow-primary-dark hover:bg-snow-surface-soft"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex min-h-[72px] shrink-0 items-center gap-3 border-b border-snow-border bg-snow-surface/76 px-4 py-2 backdrop-blur-xl sm:px-5 lg:px-6">
            <button
              aria-label={t("parent", "admin.aria.openAdminNav")}
              className="snow-focus-ring lg:hidden grid size-10 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark hover:bg-snow-surface-soft"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-snow-primary-dark">{t("parent", "admin.systemAdmin")}</h1>
              <p className="text-xs font-semibold text-snow-muted">{t("parent", "admin.systemAdminDesc")}</p>
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
