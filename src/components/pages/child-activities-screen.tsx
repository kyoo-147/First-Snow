"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, Heart, Loader2, Smile, Sparkles, Sun } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import {
  fetchDashboardRoutines,
  fetchDashboardSession,
  localDateKey,
  type AuthSession,
  type DashboardRoutine,
} from "@/lib/dashboard-client";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export function ChildActivitiesScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [routines, setRoutines] = useState<DashboardRoutine[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const moods = [
    { label: t("child", "activities.moods.happy"), icon: Smile, tone: "bg-snow-peach text-snow-primary-dark" },
    { label: t("child", "activities.moods.excited"), icon: Sparkles, tone: "bg-snow-primary text-white" },
    { label: t("child", "activities.moods.calm"), icon: Sun, tone: "bg-snow-aqua text-snow-primary-dark" },
    { label: t("child", "activities.moods.needBreak"), icon: Heart, tone: "bg-snow-lavender text-snow-primary-dark" },
  ];

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const auth = await fetchDashboardSession();
        if (ignore) return;
        setSession(auth);

        if (auth?.actorType === "child") {
          const list = await fetchDashboardRoutines(auth.child.id, localDateKey()).catch(() => []);
          if (!ignore) {
            setRoutines(list);
          }
        }
      } catch {
        // fail gracefully, preserve UI responsiveness
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const totalSteps = routines.reduce((sum, r) => sum + r.steps.length, 0);
  const completedSteps = routines.reduce((sum, r) => sum + r.steps.filter((s) => s.isCompleted).length, 0);

  if (isLoading) {
    return (
      <ChildSessionFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <Loader2 className="size-8 animate-spin text-snow-primary" />
          <p className="mt-4 text-sm font-bold text-snow-muted">{t("child", "activities.loading")}</p>
        </div>
      </ChildSessionFrame>
    );
  }

  const childGreeting = session?.actorType === "child" ? t("child", "home.hiChild", { name: session.child.name }) : undefined;

  return (
    <ChildSessionFrame>
      <PageHeader
        eyebrow={childGreeting}
        title={t("child", "activities.howAreYouFeeling")}
        description={t("child", "activities.pickCardDesc")}
        compact
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 snow-enter-soft">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-[var(--radius-xl)] bg-snow-ice p-5">
              <div className="relative mx-auto h-36 w-full max-w-[150px]">
                <Image src="/images/snow-mascot-v2.png" alt="Linh vật Snow" fill sizes="150px" className="object-contain" />
              </div>
              <div className="mt-4 rounded-[var(--radius-lg)] bg-snow-surface p-4">
                <p className="text-sm font-black text-snow-primary-dark">{t("child", "activities.agentKidSays")}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                  {t("child", "activities.pickFeelingDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-snow-primary-soft px-4 py-3">
                <p className="text-sm font-black text-snow-primary-dark">{t("child", "activities.todayCheckIn")}</p>
                <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary">
                  {selectedMood ? t("child", "activities.readyToProceed") : t("child", "activities.step1of2")}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = selectedMood === mood.label;

                  return (
                    <button
                      key={mood.label}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMood(mood.label)}
                      className={cn(
                        "snow-interactive-card snow-focus-ring flex min-h-[176px] flex-col justify-between rounded-[var(--radius-xl)] p-5 text-left shadow-[var(--shadow-card)]",
                        mood.tone,
                        isSelected && "ring-4 ring-snow-primary-soft",
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <Icon className="size-10" />
                        {isSelected ? (
                          <span className="grid size-8 place-items-center rounded-full bg-white/90 text-snow-primary snow-pop-soft">
                            <Check className="size-4" />
                          </span>
                        ) : null}
                      </span>
                      <span className="text-2xl font-black leading-tight">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5">
            <div className="flex items-start gap-3">
              <CalendarCheck className="mt-1 size-5 text-snow-primary" />
              <div className="min-w-0">
                <p className="text-base font-black text-snow-primary-dark">
                  {totalSteps > 0
                    ? t("child", "activities.checkInDone", { completed: completedSteps, total: totalSteps })
                    : t("child", "activities.todayCheckIn")}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                  {selectedMood
                    ? t("child", "activities.selectedMoodDesc", { mood: selectedMood })
                    : t("child", "activities.afterCheckIn")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedMood ? (
                    <Link
                      href={`/companion?mood=${encodeURIComponent(selectedMood)}`}
                      className="snow-interactive-card snow-focus-ring inline-flex min-h-11 items-center rounded-full bg-snow-primary px-5 text-sm font-black text-white snow-pop-soft"
                    >
                      {t("child", "activities.continueWithSnow")}
                    </Link>
                  ) : (
                    <p className="inline-flex min-h-11 items-center rounded-full bg-snow-primary-soft px-5 text-sm font-black text-snow-primary">
                      {t("child", "activities.pickOneToContinue")}
                    </p>
                  )}
                  <Link
                    href="/session/routine"
                    className="snow-focus-ring inline-flex min-h-11 items-center rounded-full border border-snow-border px-5 text-sm font-black text-snow-primary-dark"
                  >
                    {t("child", "activities.seeRoutine")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-4 self-start">
          <SnowCard className="p-5">
            <p className="text-xs font-black text-snow-primary">{t("child", "activities.dailyGoalTitle")}</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">{t("child", "activities.dailyGoalDesc")}</p>
            <div className="mt-4 rounded-full bg-snow-surface-soft px-4 py-3 text-sm font-semibold text-snow-muted">
              {t("child", "activities.dailyGoalNote")}
            </div>
          </SnowCard>
          <SnowCard className="p-5">
            <p className="text-xs font-black text-snow-primary">{t("child", "activities.agentKidCanHelpTitle")}</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">{t("child", "activities.agentKidCanHelpDesc")}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
              {t("child", "activities.feelingsScreenNote")}
            </p>
          </SnowCard>
          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <Sparkles className="size-6 text-snow-primary" />
            <p className="mt-4 text-lg font-black text-snow-primary-dark">{t("child", "activities.calmChoicesTitle")}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
              {t("child", "activities.calmChoicesDesc")}
            </p>
          </div>
        </aside>
      </div>
    </ChildSessionFrame>
  );
}
