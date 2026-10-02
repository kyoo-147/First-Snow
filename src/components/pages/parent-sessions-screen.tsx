"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Filter, PlayCircle, Star } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById, getLessonsByChildId, getSessionsByChildId } from "@/data";
import { formatSnowDate, formatSnowTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const accentBg = {
  primary: "bg-snow-primary-soft",
  aqua: "bg-snow-ice",
  peach: "bg-snow-cream",
  pink: "bg-snow-lavender",
  ice: "bg-snow-ice",
};

export function ParentSessionsScreen({ childId = "minh" }: { childId?: string }) {
  const child = getChildById(childId);
  const lessons = getLessonsByChildId(childId);
  const sessions = getSessionsByChildId(childId);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id ?? "");
  const [activeFilter, setActiveFilter] = useState<"all" | "follow-up" | "calm">("all");
  const [reviewedSessionIds, setReviewedSessionIds] = useState<string[]>([]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const featuredLesson = lessons[0];
  const filteredSessions = sessions.filter((session) => {
    if (activeFilter === "calm") return session.mood === "calm";
    if (activeFilter === "follow-up") return session.highlights.length > 0;
    return true;
  });
  const activeReviewed = activeSession ? reviewedSessionIds.includes(activeSession.id) : false;

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow={`${child.name}'s activity`}
        title="Recent sessions"
        description={`Review the latest AgentKid sessions for ${child.name}, including duration, practice topic, and parent-safe highlights.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Sessions this week" value={`${sessions.length}`} detail="Short guided activities" />
        <StatusTile label="Total time" value={`${sessions.reduce((total, session) => total + session.durationMinutes, 0)} min`} detail="Across recent sessions" />
        <StatusTile label="Reviewed" value={`${reviewedSessionIds.length} of ${sessions.length}`} detail="Parent notes checked" icon={<CheckCircle2 className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <SnowCard className="flex min-h-[520px] flex-col overflow-hidden p-3">
          <div className="border-b border-snow-border px-2 pb-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-snow-primary-dark">Session list</h2>
              <Filter className="size-4 text-snow-primary" />
            </div>
            <p className="mt-1 text-xs font-semibold text-snow-muted">Choose a recent guided session to review.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["follow-up", "Needs follow-up"],
                ["calm", "Calm"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value as typeof activeFilter)}
                  className={cn(
                    "snow-focus-ring rounded-full px-3 py-1.5 text-xs font-black transition",
                    activeFilter === value ? "bg-snow-primary text-white" : "bg-snow-primary-soft text-snow-primary-dark hover:bg-snow-lavender",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 snow-scrollbar">
            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isReviewed = reviewedSessionIds.includes(session.id);

              return (
                <button
                  key={session.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "snow-focus-ring snow-interactive-card rounded-[var(--radius-md)] border p-4 text-left",
                    isActive ? "border-snow-primary bg-snow-primary-soft" : "border-snow-border bg-snow-surface"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-snow-primary-dark">{formatSnowDate(session.date)}</span>
                    <span className={cn("rounded-full px-2 py-1 text-xs font-black", isReviewed ? "bg-snow-success/15 text-snow-success" : "bg-snow-surface text-snow-primary-dark")}>
                      {isReviewed ? "Reviewed" : formatSnowTime(session.date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-black text-snow-primary-dark">{session.title}</p>
                  <p className="mt-1 text-xs font-semibold text-snow-muted">
                    {session.durationMinutes} min | {session.mood}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {session.highlights.slice(0, 2).map((highlight) => (
                      <span key={highlight} className="rounded-full bg-snow-surface px-2 py-1 text-[11px] font-bold text-snow-muted">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </SnowCard>

        <div className="space-y-4">
          {activeSession ? (
            <SnowCard className="overflow-hidden">
              <div className="border-b border-snow-border bg-snow-surface-soft px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-snow-primary-dark">{activeSession.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-snow-muted">
                      {formatSnowDate(activeSession.date)} | {activeSession.durationMinutes} minutes | {activeSession.mood}
                    </p>
                  </div>
                  <SnowButton
                    variant={activeReviewed ? "soft" : "primary"}
                    className="min-h-9 px-3 text-xs"
                    onClick={() => {
                      setReviewedSessionIds((ids) => activeReviewed ? ids.filter((id) => id !== activeSession.id) : [...ids, activeSession.id]);
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    {activeReviewed ? "Reviewed" : "Mark reviewed"}
                  </SnowButton>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">What worked</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                    Visual choices and one familiar prompt helped {child.name} settle into the session without rushing.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Suggested follow-up</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                    Repeat the same calm opening before the next lesson and keep transitions short.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Parent-friendly summary</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-snow-primary-dark">
                    {child.name} stayed with the session more easily when the activity started with a familiar visual cue and kept the prompt count low.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-ice p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Session anchors</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Opening", "Familiar story cue"],
                      ["Pace", child.comfortStyle],
                      ["Close", "Ended calmly"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[var(--radius-md)] bg-snow-surface px-3 py-2">
                        <p className="text-[11px] font-black text-snow-muted">{label}</p>
                        <p className="mt-1 text-xs font-black text-snow-primary-dark">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SnowCard>
          ) : null}

          <SnowCard className="overflow-hidden">
            <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
              <div className={`relative min-h-36 ${accentBg[featuredLesson.accent]}`}>
                <Image src={featuredLesson.image} alt="" fill className="object-contain p-4" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-snow-muted">
                  <span>Practice context</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {featuredLesson.duration}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-black leading-tight text-snow-primary-dark">{featuredLesson.title}</h2>
                <p className="mt-1 text-sm font-semibold text-snow-muted">Use this as the next familiar opening after reviewing the session.</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-snow-border pt-4">
                  <div className="flex items-center gap-1 text-snow-warning">
                    {[0, 1, 2, 3].map((item) => <Star key={item} className="size-4 fill-current" />)}
                    <Star className="size-4" />
                  </div>
                  <SnowButton variant="soft" className="min-h-9 px-3 text-xs">
                    <PlayCircle className="mr-1.5 size-3.5" />
                    Replay
                  </SnowButton>
                </div>
              </div>
            </div>
          </SnowCard>
        </div>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Parent review notes</h2>
            <div className="mt-4 space-y-3">
              {[
                "No urgent concerns found in this session.",
                "Shorter activity blocks still appear to help the transition into practice.",
                "Story-led openings continue to support steadier responses.",
              ].map((item) => (
                <div key={item} className="rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-sm font-semibold leading-6 text-snow-primary-dark">
                  {item}
                </div>
              ))}
            </div>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Recent lesson</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative size-16 overflow-hidden rounded-[var(--radius-md)] bg-snow-surface-soft">
                <Image src={featuredLesson.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-snow-primary-dark">{featuredLesson.title}</p>
                <p className="mt-1 text-xs font-semibold text-snow-muted">{featuredLesson.progress}% ready to revisit</p>
              </div>
            </div>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Next calm move</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">Keep the next session short, then offer one familiar story before switching to a lesson.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
