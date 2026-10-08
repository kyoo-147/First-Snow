"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogOut, Sparkles, UserCheck } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { getAuthSession, logoutUser } from "./auth-api";
import type { AuthSessionData } from "./auth-types";
import { t } from "@/i18n";

export function SessionSwitchView() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const s = await getAuthSession();
        if (isMounted) setSession(s);
      } catch {
        if (isMounted) setSession({ isAuthenticated: false });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Active Context Badge */}
      <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface-soft p-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-snow-border bg-snow-primary-soft">
            <Image
              src="/images/snow-avatar-final.png"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-snow-muted">
              {t("auth", "sessionSwitch.view.currentSession")}
            </p>
            <p className="truncate text-base font-black text-snow-primary-dark">
              {session?.child?.name
                ? `${session.child.name} (${t("auth", "sessionSwitch.view.childMode")})`
                : session?.user?.name
                  ? `${session.user.name} (${t("auth", "sessionSwitch.view.guardianMode")})`
                  : isLoading
                    ? t("auth", "sessionSwitch.view.checking")
                    : t("auth", "sessionSwitch.view.noSession")}
            </p>
          </div>
          <UserCheck className="size-5 shrink-0 text-snow-success" />
        </div>
      </div>

      {/* Switch Options List */}
      <div className="space-y-3">
        <p className="snow-body-small snow-font-readable font-bold text-snow-muted">
          {t("auth", "sessionSwitch.view.selectAction")}
        </p>

        {/* Option 1: Switch Child */}
        <Link
          href="/child-login"
          className="snow-focus-ring snow-interactive-card flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-4 shadow-[var(--shadow-soft)] transition hover:border-snow-primary hover:bg-snow-primary-soft/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-ice text-snow-primary-dark">
              <Sparkles className="size-5 text-snow-primary" />
            </div>
            <div>
              <h3 className="snow-font-child text-sm font-black text-snow-primary-dark">
                {t("auth", "sessionSwitch.view.switchChild")}
              </h3>
              <p className="text-xs font-semibold text-snow-muted">
                {t("auth", "sessionSwitch.view.switchChildSub")}
              </p>
            </div>
          </div>
        </Link>

        {/* Option 2: Go to Guardian Portal */}
        <Link
          href="/parent"
          className="snow-focus-ring snow-interactive-card flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-4 shadow-[var(--shadow-soft)] transition hover:border-snow-primary hover:bg-snow-primary-soft/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary-dark">
              <Lock className="size-5 text-snow-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-snow-primary-dark">
                {t("auth", "sessionSwitch.view.guardianPortal")}
              </h3>
              <p className="text-xs font-semibold text-snow-muted">
                {t("auth", "sessionSwitch.view.guardianPortalSub")}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Sign Out Option */}
      <div className="pt-2 border-t border-snow-border/60">
        <SnowButton
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="ghost"
          className="w-full text-sm font-extrabold text-snow-danger hover:bg-snow-danger/10 hover:text-snow-danger"
        >
          <LogOut className="size-4" />
          {isLoggingOut ? t("auth", "sessionSwitch.view.signingOut") : t("auth", "sessionSwitch.view.signOutAll")}
        </SnowButton>
      </div>
    </div>
  );
}
