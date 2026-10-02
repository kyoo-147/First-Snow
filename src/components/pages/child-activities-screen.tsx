"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, Heart, Smile, Sparkles, Sun } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";

const moods = [
  { label: "Happy", icon: Smile, tone: "bg-snow-peach text-snow-primary-dark" },
  { label: "Excited", icon: Sparkles, tone: "bg-snow-primary text-white" },
  { label: "Calm", icon: Sun, tone: "bg-snow-aqua text-snow-primary-dark" },
  { label: "Need a break", icon: Heart, tone: "bg-snow-lavender text-snow-primary-dark" },
];

export function ChildActivitiesScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <ChildSessionFrame>
      <PageHeader title="How are you feeling?" description="Pick one card. AgentKid can help with a calm next step." compact />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 snow-enter-soft">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-[var(--radius-xl)] bg-snow-ice p-5">
              <div className="relative mx-auto h-36 w-full max-w-[150px]">
                <Image src="/images/snow-mascot-ui.png" alt="" fill sizes="150px" className="object-contain" />
              </div>
              <div className="mt-4 rounded-[var(--radius-lg)] bg-snow-surface p-4">
                <p className="text-sm font-black text-snow-primary-dark">AgentKid says</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Pick the feeling that fits best. One calm choice is enough.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-snow-primary-soft px-4 py-3">
                <p className="text-sm font-black text-snow-primary-dark">Feeling check-in</p>
                <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary">Step 1 of 3</span>
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
                <p className="text-base font-black text-snow-primary-dark">Today&apos;s routine is ready</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                  {selectedMood ? `You picked "${selectedMood}". AgentKid can help with one small next step.` : "After your check-in, AgentKid can help with the next small step."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedMood ? (
                    <Link
                      href="/companion"
                      className="snow-interactive-card snow-focus-ring inline-flex min-h-11 items-center rounded-full bg-snow-primary px-5 text-sm font-black text-white snow-pop-soft"
                    >
                      Continue with AgentKid
                    </Link>
                  ) : (
                    <p className="inline-flex min-h-11 items-center rounded-full bg-snow-primary-soft px-5 text-sm font-black text-snow-primary">Pick one feeling to continue.</p>
                  )}
                  <Link href="/session/routine" className="snow-focus-ring inline-flex min-h-11 items-center rounded-full border border-snow-border px-5 text-sm font-black text-snow-primary-dark">
                    See routine
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-4 self-start">
          <SnowCard className="p-5">
            <p className="text-xs font-black text-snow-primary">Daily goal</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">Pick one feeling, then return to your routine.</p>
            <div className="mt-4 rounded-full bg-snow-surface-soft px-4 py-3 text-sm font-semibold text-snow-muted">One calm check-in is enough for this step.</div>
          </SnowCard>
          <SnowCard className="p-5">
            <p className="text-xs font-black text-snow-primary">AgentKid can help next</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">Talk first, then return to routine.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Feelings screens should stay short and gentle, not crowded.</p>
          </SnowCard>
          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <Sparkles className="size-6 text-snow-primary" />
            <p className="mt-4 text-lg font-black text-snow-primary-dark">Calm choices only</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">AgentKid keeps one simple next action visible after a feeling is picked.</p>
          </div>
        </aside>
      </div>
    </ChildSessionFrame>
  );
}
