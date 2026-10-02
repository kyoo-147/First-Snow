"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Circle, Heart, Home, Sparkles, TimerReset } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getRoutinesByChildId } from "@/data";
import { cn } from "@/lib/utils";

export function ChildRoutineScreen() {
  const routine = getRoutinesByChildId("minh")[0];
  const initialChecked = useMemo(() => new Set(routine.steps.filter((step) => step.isCompleted).map((step) => step.id)), [routine.steps]);
  const [checkedSteps, setCheckedSteps] = useState(initialChecked);

  const completedCount = checkedSteps.size;
  const isDone = completedCount === routine.steps.length;
  const progressValue = Math.round((completedCount / routine.steps.length) * 100);

  function toggleStep(stepId: string) {
    setCheckedSteps((current) => {
      const next = new Set(current);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  return (
    <ChildSessionFrame className="gap-4">
      <PageHeader
        title="Today's routine"
        description="One small step at a time. AgentKid can pause with you whenever you need."
        action={
          <Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft">
            <Home className="size-4" /> Back to today
          </Link>
        }
        compact
      />

      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="overflow-hidden snow-enter-soft">
          <div className="bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender p-5 md:p-6">
            <p className="text-sm font-black text-snow-primary">Ready now</p>
            <h2 className="snow-title mt-2 text-snow-primary-dark md:text-[40px]">{routine.title}</h2>
            <p className="snow-body-copy snow-font-readable mt-3 max-w-[620px] font-semibold text-snow-muted md:text-base">
              Finish the next gentle step, then choose a calm pause or talk with AgentKid.
            </p>
          </div>

          <div className="space-y-3 p-5 md:p-6">
            <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-black text-snow-primary-dark">
                <span>Routine progress</span>
                <span>{progressValue}%</span>
              </div>
              <ProgressStrip value={progressValue} />
            </div>

            {routine.steps.map((step, index) => {
              const isChecked = checkedSteps.has(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  aria-pressed={isChecked}
                  className={cn(
                    "snow-interactive-card snow-focus-ring flex w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left",
                    isChecked ? "border-snow-success bg-snow-surface-soft" : "border-snow-border bg-snow-surface hover:bg-snow-surface-soft",
                  )}
                >
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", isChecked ? "bg-snow-success text-white snow-pop-soft" : "bg-snow-primary-soft text-snow-primary")}>
                    {isChecked ? <Check className="size-5" /> : <Circle className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black text-snow-primary-dark">{step.title}</span>
                    <span className="snow-body-small snow-font-readable mt-1 block font-semibold text-snow-muted">{step.durationMinutes} min - Step {index + 1}</span>
                  </span>
                  <span className="hidden rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary sm:inline-flex">
                    {isChecked ? "Done" : "Next"}
                  </span>
                </button>
              );
            })}
          </div>
        </SnowCard>

        <aside className="space-y-4">
          <div className={cn("rounded-[var(--radius-xl)] bg-snow-primary-soft p-5", isDone && "snow-pop-soft")}>
            <span className={cn("grid size-12 place-items-center rounded-full bg-snow-surface text-snow-primary", !isDone && "snow-calm-pulse")}>
              <Sparkles className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-black text-snow-primary-dark">
              {isDone ? "Nice work" : `${completedCount} of ${routine.steps.length} done`}
            </h2>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
              {isDone ? "You finished this routine. AgentKid can help you pick what comes next." : "Check one step when it feels complete. No rushing."}
            </p>
            {isDone ? (
              <div className="mt-4 grid gap-2">
                <Link href="/session/lessons" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary text-sm font-black text-white transition hover:brightness-105">
                  <BookOpen className="size-4" /> Choose a lesson
                </Link>
                <Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-surface text-sm font-black text-snow-primary-dark transition hover:bg-white">
                  <Home className="size-4" /> Finish for now
                </Link>
              </div>
            ) : null}
          </div>

          <SnowCard className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark">
              <TimerReset className="size-5 text-snow-primary" />
              Calm pause
            </h2>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">Take one slow breath before the next step.</p>
            <Link href="/companion" className="mt-4 inline-flex">
              <SnowButton>
                Talk with AgentKid
                <ArrowRight className="size-4" />
              </SnowButton>
            </Link>
          </SnowCard>

          <SnowCard className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark">
              <Heart className="size-5 text-snow-primary" />
              Feeling check
            </h2>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">If the next step feels big, tell AgentKid how you feel first.</p>
            <Link href="/session/activities" className="mt-4 inline-flex text-sm font-black text-snow-primary">
              Pick a feeling
            </Link>
          </SnowCard>
        </aside>
      </section>
    </ChildSessionFrame>
  );
}
