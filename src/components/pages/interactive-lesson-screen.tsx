"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Heart, RotateCcw, Smile, Sun, Volume2 } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";

const feelings = [
  { id: "happy", label: "Happy", helper: "Bright and smiling", icon: Smile, tone: "bg-snow-cream" },
  { id: "sad", label: "Sad", helper: "Needs gentle care", icon: Heart, tone: "bg-snow-primary-soft" },
  { id: "calm", label: "Calm", helper: "Quiet and steady", icon: Sun, tone: "bg-snow-ice" },
];

export function InteractiveLessonScreen() {
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const selectedLabel = feelings.find((feeling) => feeling.id === selectedFeeling)?.label;

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 pb-8 snow-enter-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/session/lessons" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-snow-primary">
            <ArrowLeft className="size-4" />
            Back to lessons
          </Link>
          <p className="text-xs font-black uppercase tracking-wide text-snow-primary">Feelings and emotions</p>
          <h1 className="mt-1 text-[30px] font-black leading-tight text-snow-primary-dark md:text-[36px]">Feelings Practice</h1>
          <p className="mt-2 max-w-[620px] text-sm font-semibold leading-6 text-snow-muted md:text-base">
            Look at the picture. Pick the feeling that fits best.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-snow-primary-soft px-4 py-2 text-xs font-black text-snow-primary">
          Step 2 of 5
        </div>
      </div>

      <section className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[var(--radius-xl)] bg-snow-ice p-5">
          <div className="relative mx-auto size-36 snow-float-soft">
            <Image src="/images/snow-mascot-ui.png" alt="" fill sizes="128px" className="object-contain" />
          </div>
          <div className="mt-4 rounded-[var(--radius-lg)] bg-snow-surface p-4">
            <p className="text-sm font-black text-snow-primary-dark">AgentKid says</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
              There is no wrong feeling. We are just practicing how to name it.
            </p>
          </div>
          </div>
          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <p className="text-sm font-black text-snow-primary-dark">Mini reminder</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Pick one answer, then check it. AgentKid keeps the next step simple.</p>
          </div>
        </aside>

        <SnowCard className="overflow-hidden">
          <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label="Play lesson audio"
                  className="snow-interactive-card snow-focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary"
                >
                  <Volume2 className="size-5" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-snow-primary-dark">How does the fox feel?</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">Choose one card. AgentKid will help with the next step.</p>
                </div>
              </div>

              <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] bg-snow-surface-soft">
                <Image src="/images/lesson-story.png" alt="Story scene for a feeling practice lesson" fill sizes="720px" className="object-cover" />
              </div>
            </div>

            <div className="space-y-3">
              {feelings.map((feeling) => {
                const Icon = feeling.icon;
                const isSelected = selectedFeeling === feeling.id;
                return (
                  <button
                    key={feeling.id}
                    type="button"
                    onClick={() => {
                      setSelectedFeeling(feeling.id);
                      setIsComplete(false);
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "snow-interactive-card snow-focus-ring flex min-h-[92px] w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left",
                      isSelected ? "border-snow-primary bg-snow-primary-soft" : "border-snow-border bg-snow-surface-soft hover:bg-snow-surface",
                    )}
                  >
                    <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", feeling.tone)}>
                      <Icon className="size-6 text-snow-primary-dark" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-black text-snow-primary-dark">{feeling.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-snow-muted">{feeling.helper}</span>
                    </span>
                    {isSelected ? <Check className="size-5 shrink-0 text-snow-primary snow-pop-soft" /> : null}
                  </button>
                );
              })}

              <SnowButton
                disabled={!selectedFeeling}
                className={cn("mt-2 w-full justify-center", !selectedFeeling && "pointer-events-none opacity-55")}
                onClick={() => setIsComplete(true)}
              >
                Check answer
              </SnowButton>

              <div className={cn("rounded-[var(--radius-md)] p-4 text-sm font-semibold leading-6", isComplete ? "bg-snow-success/15 text-snow-primary-dark snow-pop-soft" : "bg-snow-surface-soft text-snow-muted")}>
                {isComplete ? `Nice. You picked ${selectedLabel}. AgentKid can help talk about that feeling.` : "Pick one feeling card to continue."}
              </div>

              {isComplete ? (
                <div className="grid gap-2 sm:grid-cols-2 snow-pop-soft">
                  <SnowButton type="button" variant="soft" className="w-full">
                    <Volume2 className="size-4" />
                    Play audio
                  </SnowButton>
                  <SnowButton
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setSelectedFeeling(null);
                      setIsComplete(false);
                    }}
                  >
                    <RotateCcw className="size-4" />
                    Try again
                  </SnowButton>
                </div>
              ) : null}
            </div>
          </div>
          <div className="border-t border-snow-border bg-snow-surface-soft/70 px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <SnowButton type="button" variant="ghost">
                  <RotateCcw className="size-4" />
                  Repeat
                </SnowButton>
                <SnowButton type="button" variant="ghost">
                  <Volume2 className="size-4" />
                  Play audio
                </SnowButton>
              </div>
              <div className="rounded-full bg-snow-primary px-6 py-3 text-sm font-black text-white shadow-[var(--shadow-card)]">
                Hold to talk
              </div>
            </div>
          </div>
        </SnowCard>
      </section>
    </div>
  );
}
