"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, MonitorPlay, Sparkles } from "lucide-react";
import { TalkShell } from "@/components/companion/talk-shell";
import { getChildSession } from "@/lib/companion-client";
import { t } from "@/i18n";

export function TalkScreen() {
  const [childId, setChildId] = useState<string | null>(null);
  const [isResolvingChild, setIsResolvingChild] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function resolveChild() {
      const child = await getChildSession();
      if (!cancelled) {
        setChildId(child?.id ?? null);
        setIsResolvingChild(false);
      }
    }
    void resolveChild();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <header className="z-10 mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-4xl font-black text-snow-primary-dark">
            {t("companion", "talk.title")} <Sparkles className="size-6 text-snow-primary" />
          </h1>
          <p className="mt-2 text-base font-bold text-snow-muted">
            {t("companion", "talk.subtitle")}
          </p>
        </div>
        <Link
          href="/companion/avatar"
          className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft"
        >
          <MonitorPlay className="size-4 text-snow-primary" />
          {t("companion", "talk.avatarMode")}
        </Link>
      </header>

      {/* Mascot decoration */}
      <div className="-mr-10 absolute right-0 top-0 z-0 hidden lg:block">
        <Image
          src="/images/snow-mascot.png"
          alt=""
          width={160}
          height={160}
          className="opacity-90 drop-shadow-lg"
        />
      </div>

      {/* Real API-backed chat shell, bound to the signed-in child session */}
      {isResolvingChild ? (
        <div
          role="status"
          aria-busy="true"
          aria-label={t("companion", "talk.loadingCompanion")}
          className="z-10 flex flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-snow-border bg-white p-8 text-snow-muted shadow-sm"
        >
          <Loader2 className="size-8 animate-spin text-snow-primary" />
          <p className="text-sm font-bold">{t("companion", "talk.loadingCompanion")}</p>
        </div>
      ) : childId ? (
        <TalkShell childId={childId} />
      ) : (
        <div
          role="alert"
          className="z-10 flex flex-1 flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border border-snow-border bg-white p-8 text-center shadow-sm"
        >
          <p className="text-sm font-bold text-snow-danger">
            {t("companion", "talk.signInAlert")}
          </p>
          <Link
            href="/child-login"
            className="snow-focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-snow-primary px-6 text-sm font-extrabold text-white transition hover:brightness-105"
          >
            {t("companion", "talk.signInButton")}
          </Link>
        </div>
      )}
    </div>
  );
}
