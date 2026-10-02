"use client";

import { CalendarCheck, Moon, Plus, Sparkles, Sun } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById, getRoutinesByChildId } from "@/data";
import { cn } from "@/lib/utils";

export function ParentRoutinesScreen({ childId = "minh" }: { childId?: string }) {
  const child = getChildById(childId);
  const routines = getRoutinesByChildId(childId);
  const completedSteps = routines.flatMap((routine) => routine.steps).filter((step) => step.isCompleted).length;
  const totalSteps = routines.flatMap((routine) => routine.steps).length;

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={`${child.name}'s routines`}
        title="Daily routines"
        description={`Manage predictable learning and wind-down routines for ${child.name}.`}
        action={
          <SnowButton>
            <Plus className="mr-2 size-4" />
            Add routine
          </SnowButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Active routines" value={`${routines.length}`} detail="Morning and evening" icon={<CalendarCheck className="size-5 text-snow-primary" />} />
        <StatusTile label="Steps complete" value={`${completedSteps}/${totalSteps}`} detail="Today" icon={<Sparkles className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Routine style" value="Predictable" detail={child.comfortStyle} icon={<Sun className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SnowCard className="p-5">
          <h2 className="text-xl font-black text-snow-primary-dark">Routine schedule</h2>
          <div className="mt-5 space-y-4">
            {routines.map((routine) => {
              const Icon = routine.timeOfDay === "morning" ? Sun : routine.timeOfDay === "evening" ? Moon : Sparkles;

              return (
                <div key={routine.id} className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("grid size-11 place-items-center rounded-full", routine.timeOfDay === "morning" ? "bg-snow-cream text-snow-warning" : "bg-snow-primary-soft text-snow-primary")}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-snow-primary-dark">{routine.title}</h3>
                        <p className="text-sm font-semibold capitalize text-snow-muted">{routine.timeOfDay} - {routine.steps.length} steps</p>
                      </div>
                    </div>
                    <div className={cn("relative h-6 w-11 rounded-full transition-colors", routine.isActive ? "bg-snow-primary" : "bg-snow-border")}>
                      <div className={cn("absolute top-1 size-4 rounded-full bg-white transition-transform", routine.isActive ? "right-1" : "left-1")} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {routine.steps.map((step) => (
                      <div key={step.id} className="rounded-[var(--radius-sm)] bg-snow-surface px-3 py-2">
                        <p className="text-xs font-black text-snow-primary-dark">{step.title}</p>
                        <p className="mt-1 text-[11px] font-semibold text-snow-muted">{step.durationMinutes} min - {step.isCompleted ? "Done" : "Up next"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SnowCard>

        <aside className="space-y-4">
          <SnowCard className="bg-snow-lavender p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Routine note</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Short, repeatable steps help AgentKid keep each child session predictable.</p>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Suggested adjustment</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Keep feeling check-in before lesson practice tomorrow.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
