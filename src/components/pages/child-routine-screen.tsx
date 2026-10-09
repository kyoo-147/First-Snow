"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Circle, Heart, Home, Sparkles, TimerReset } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type RoutineStep = { id: string; title: string; durationMinutes: number; isCompleted: boolean };
type Routine = { id: string; title: string; isActive: boolean; steps: RoutineStep[] };

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message ?? body?.message ?? t("common", "error");
  } catch {
    return t("common", "error");
  }
}

export function ChildRoutineScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const date = localDate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sessionResponse = await fetch("/api/auth/session", { credentials: "same-origin" });
        if (!sessionResponse.ok) throw new Error(await readError(sessionResponse));
        const sessionPayload = await sessionResponse.json();
        const session = sessionPayload?.session;
        if (session?.actorType !== "child" || typeof session.child?.id !== "string") {
          throw new Error(t("child", "routine.signInRequired"));
        }
        const id = session.child.id as string;
        const response = await fetch(`/api/children/${encodeURIComponent(id)}/routines?date=${date}`, { credentials: "same-origin" });
        if (!response.ok) throw new Error(await readError(response));
        const payload = await response.json();
        if (!cancelled) {
          setChildId(id);
          setRoutines(Array.isArray(payload.routines) ? payload.routines : []);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t("child", "routine.errorLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [date, refreshKey]);

  const steps = routines.flatMap((routine) => routine.steps);
  const completedCount = steps.filter((step) => step.isCompleted).length;
  const isDone = steps.length > 0 && completedCount === steps.length;
  const progressValue = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  async function toggleStep(step: RoutineStep) {
    if (!childId || savingStep) return;
    setSavingStep(step.id);
    setError(null);
    try {
      const response = await fetch(`/api/children/${encodeURIComponent(childId)}/routines/completions`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: step.id, date, completed: !step.isCompleted }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setRoutines((current) => current.map((routine) => ({
        ...routine,
        steps: routine.steps.map((item) => item.id === step.id ? { ...item, isCompleted: !step.isCompleted } : item),
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("child", "routine.errorUpdate"));
    } finally {
      setSavingStep(null);
    }
  }

  return (
    <ChildSessionFrame className="gap-4">
      <PageHeader
        title={t("child", "routine.title")}
        description={t("child", "routine.description")}
        action={<Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft"><Home className="size-4" /> {t("child", "routine.backHome")}</Link>}
        compact
      />

      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}<button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="ml-3 underline">{t("common", "retry")}</button></div> : null}
      {loading ? <SnowCard className="p-6" aria-live="polite">{t("child", "routine.loading")}</SnowCard> : null}
      {!loading && !error && steps.length === 0 ? <SnowCard className="p-8 text-center"><h2 className="text-xl font-black text-snow-primary-dark">{t("child", "routine.emptyTitle")}</h2><p className="mt-2 text-sm font-semibold text-snow-muted">{t("child", "routine.emptyDesc")}</p></SnowCard> : null}

      {!loading && steps.length > 0 ? <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="overflow-hidden snow-enter-soft">
          <div className="bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender p-5 md:p-6">
            <p className="text-sm font-black text-snow-primary">{t("child", "routine.readyNow")}</p>
            <h2 className="snow-title mt-2 text-snow-primary-dark md:text-[40px]">{routines.find((routine) => routine.steps.length)?.title}</h2>
            <p className="snow-body-copy snow-font-readable mt-3 max-w-[620px] font-semibold text-snow-muted md:text-base">{t("child", "routine.stepSubtitle")}</p>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-black text-snow-primary-dark"><span>{t("child", "routine.routineProgress")}</span><span>{progressValue}%</span></div>
              <ProgressStrip value={progressValue} />
            </div>
            {routines.flatMap((routine) => routine.steps.map((step, index) => ({ routine, step, index }))).map(({ step, index }) => <button key={step.id} type="button" disabled={savingStep !== null} onClick={() => void toggleStep(step)} aria-pressed={step.isCompleted} className={cn("snow-interactive-card snow-focus-ring flex w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left disabled:opacity-60", step.isCompleted ? "border-snow-success bg-snow-surface-soft" : "border-snow-border bg-snow-surface hover:bg-snow-surface-soft")}>
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", step.isCompleted ? "bg-snow-success text-white snow-pop-soft" : "bg-snow-primary-soft text-snow-primary")}>{step.isCompleted ? <Check className="size-5" /> : <Circle className="size-5" />}</span>
              <span className="min-w-0 flex-1"><span className="block text-base font-black text-snow-primary-dark">{step.title}</span><span className="snow-body-small snow-font-readable mt-1 block font-semibold text-snow-muted">{t("child", "routine.stepCount", { duration: step.durationMinutes, index: index + 1 })}</span></span>
              <span className="hidden rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary sm:inline-flex">{savingStep === step.id ? t("child", "routine.saving") : step.isCompleted ? t("child", "routine.done") : t("child", "routine.next")}</span>
            </button>)}
          </div>
        </SnowCard>
        <aside className="space-y-4">
          <div className={cn("rounded-[var(--radius-xl)] bg-snow-primary-soft p-5", isDone && "snow-pop-soft")}>
            <span className={cn("grid size-12 place-items-center rounded-full bg-snow-surface text-snow-primary", !isDone && "snow-calm-pulse")}><Sparkles className="size-6" /></span>
            <h2 className="mt-4 text-xl font-black text-snow-primary-dark">{isDone ? t("child", "routine.niceWork") : t("child", "routine.completedSummary", { completed: completedCount, total: steps.length })}</h2>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">{isDone ? t("child", "routine.finishedDesc") : t("child", "routine.takeYourTimeDesc")}</p>
            {isDone ? <div className="mt-4 grid gap-2"><Link href="/session/lessons" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary text-sm font-black text-white transition hover:brightness-105"><BookOpen className="size-4" /> {t("child", "routine.chooseLesson")}</Link><Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-surface text-sm font-black text-snow-primary-dark transition hover:bg-white"><Home className="size-4" /> {t("child", "routine.finishForNow")}</Link></div> : null}
          </div>
          <SnowCard className="p-5"><h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><TimerReset className="size-5 text-snow-primary" />{t("child", "routine.calmPause")}</h2><p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">{t("child", "routine.calmPauseDesc")}</p><Link href="/mia" className="mt-4 inline-flex"><SnowButton>{t("child", "routine.talkWithAgentKid")}<ArrowRight className="size-4" /></SnowButton></Link></SnowCard>
          <SnowCard className="p-5"><h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><Heart className="size-5 text-snow-primary" />{t("child", "routine.feelingCheck")}</h2><p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">{t("child", "routine.feelingCheckDesc")}</p><Link href="/session/activities" className="mt-4 inline-flex text-sm font-black text-snow-primary">{t("child", "routine.pickFeeling")}</Link></SnowCard>
        </aside>
      </section> : null}
    </ChildSessionFrame>
  );
}
