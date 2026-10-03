"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Circle, Heart, Home, Sparkles, TimerReset } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";

type RoutineStep = { id: string; title: string; durationMinutes: number; isCompleted: boolean };
type Routine = { id: string; title: string; isActive: boolean; steps: RoutineStep[] };

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message ?? body?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
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
          throw new Error("Sign in with a child profile to view today's routine.");
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
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load today's routine.");
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
      setError(cause instanceof Error ? cause.message : "Could not update this step.");
    } finally {
      setSavingStep(null);
    }
  }

  return (
    <ChildSessionFrame className="gap-4">
      <PageHeader
        title="Today's routine"
        description="One small step at a time. AgentKid can pause with you whenever you need."
        action={<Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft"><Home className="size-4" /> Back to today</Link>}
        compact
      />

      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}<button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="ml-3 underline">Try again</button></div> : null}
      {loading ? <SnowCard className="p-6" aria-live="polite">Loading today&apos;s routine…</SnowCard> : null}
      {!loading && !error && steps.length === 0 ? <SnowCard className="p-8 text-center"><h2 className="text-xl font-black text-snow-primary-dark">No routine steps yet</h2><p className="mt-2 text-sm font-semibold text-snow-muted">Your grown-up can add a gentle routine for today.</p></SnowCard> : null}

      {!loading && steps.length > 0 ? <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="overflow-hidden snow-enter-soft">
          <div className="bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender p-5 md:p-6">
            <p className="text-sm font-black text-snow-primary">Ready now</p>
            <h2 className="snow-title mt-2 text-snow-primary-dark md:text-[40px]">{routines.find((routine) => routine.steps.length)?.title}</h2>
            <p className="snow-body-copy snow-font-readable mt-3 max-w-[620px] font-semibold text-snow-muted md:text-base">Finish the next gentle step, then choose a calm pause or talk with AgentKid.</p>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-black text-snow-primary-dark"><span>Routine progress</span><span>{progressValue}%</span></div>
              <ProgressStrip value={progressValue} />
            </div>
            {routines.flatMap((routine) => routine.steps.map((step, index) => ({ routine, step, index }))).map(({ step, index }) => <button key={step.id} type="button" disabled={savingStep !== null} onClick={() => void toggleStep(step)} aria-pressed={step.isCompleted} className={cn("snow-interactive-card snow-focus-ring flex w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left disabled:opacity-60", step.isCompleted ? "border-snow-success bg-snow-surface-soft" : "border-snow-border bg-snow-surface hover:bg-snow-surface-soft")}>
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", step.isCompleted ? "bg-snow-success text-white snow-pop-soft" : "bg-snow-primary-soft text-snow-primary")}>{step.isCompleted ? <Check className="size-5" /> : <Circle className="size-5" />}</span>
              <span className="min-w-0 flex-1"><span className="block text-base font-black text-snow-primary-dark">{step.title}</span><span className="snow-body-small snow-font-readable mt-1 block font-semibold text-snow-muted">{step.durationMinutes} min - Step {index + 1}</span></span>
              <span className="hidden rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary sm:inline-flex">{savingStep === step.id ? "Saving" : step.isCompleted ? "Done" : "Next"}</span>
            </button>)}
          </div>
        </SnowCard>
        <aside className="space-y-4">
          <div className={cn("rounded-[var(--radius-xl)] bg-snow-primary-soft p-5", isDone && "snow-pop-soft")}>
            <span className={cn("grid size-12 place-items-center rounded-full bg-snow-surface text-snow-primary", !isDone && "snow-calm-pulse")}><Sparkles className="size-6" /></span>
            <h2 className="mt-4 text-xl font-black text-snow-primary-dark">{isDone ? "Nice work" : `${completedCount} of ${steps.length} done`}</h2>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">{isDone ? "You finished this routine. AgentKid can help you pick what comes next." : "Check one step when it feels complete. No rushing."}</p>
            {isDone ? <div className="mt-4 grid gap-2"><Link href="/session/lessons" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary text-sm font-black text-white transition hover:brightness-105"><BookOpen className="size-4" /> Choose a lesson</Link><Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-surface text-sm font-black text-snow-primary-dark transition hover:bg-white"><Home className="size-4" /> Finish for now</Link></div> : null}
          </div>
          <SnowCard className="p-5"><h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><TimerReset className="size-5 text-snow-primary" />Calm pause</h2><p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">Take one slow breath before the next step.</p><Link href="/companion" className="mt-4 inline-flex"><SnowButton>Talk with AgentKid<ArrowRight className="size-4" /></SnowButton></Link></SnowCard>
          <SnowCard className="p-5"><h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><Heart className="size-5 text-snow-primary" />Feeling check</h2><p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">If the next step feels big, tell AgentKid how you feel first.</p><Link href="/session/activities" className="mt-4 inline-flex text-sm font-black text-snow-primary">Pick a feeling</Link></SnowCard>
        </aside>
      </section> : null}
    </ChildSessionFrame>
  );
}
