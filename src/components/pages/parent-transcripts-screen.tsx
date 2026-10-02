"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarClock, CheckCircle2, Download, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById, getSessionsByChildId, getTranscriptBySessionId } from "@/data";
import { formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ParentTranscriptsScreen({ childId = "minh" }: { childId?: string }) {
  const child = getChildById(childId);
  const sessions = getSessionsByChildId(childId);
  const [activeSessionId, setActiveSessionId] = useState(sessions.length > 0 ? sessions[0].id : null);
  const [reviewedSessionIds, setReviewedSessionIds] = useState<string[]>([]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || sessions[0];
  const transcripts = activeSession ? getTranscriptBySessionId(activeSession.id) : [];
  const activeReviewed = activeSession ? reviewedSessionIds.includes(activeSession.id) : false;

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow={`${child.name}'s records`}
        title="Transcripts"
        description={`Review parent-safe conversation excerpts between ${child.name} and AgentKid. These notes are for observation and follow-up only.`}
        action={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-snow-muted" />
              <input
                type="text"
                aria-label="Search parent-safe conversation records"
                placeholder="Search conversations..."
                className="snow-font-readable h-11 w-full min-w-[260px] rounded-full border border-snow-border bg-snow-surface pl-9 pr-4 text-sm font-semibold outline-none transition focus:border-snow-primary focus:ring-2 focus:ring-snow-primary-soft"
              />
            </div>
            <SnowButton variant="soft">
              <Download className="mr-2 size-4" />
              Export
            </SnowButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusTile label="Selected child" value={`${child.name}, age ${child.age}`} detail={child.grade} icon={<ShieldCheck className="size-5 text-snow-primary" />} />
        <StatusTile label="Latest session" value={activeSession ? `${activeSession.durationMinutes} min` : "No session"} detail={activeSession?.title ?? "Select a session"} icon={<CalendarClock className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Stored transcript" value={`${transcripts.length} messages`} detail="Preview only" icon={<MessageSquare className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
        <StatusTile label="Sharing" value="Parent-only" detail="No child-facing export controls" tone="bg-snow-cream" />
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
        <SnowCard className="flex min-h-[500px] flex-col overflow-hidden p-3">
          <div className="border-b border-snow-border px-2 pb-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="snow-heading text-[1.05rem] font-black text-snow-primary-dark">Session list</h2>
              <span className="rounded-full bg-snow-primary-soft px-2.5 py-1 text-xs font-black text-snow-primary-dark">{sessions.length} records</span>
            </div>
            <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">Choose one conversation to inspect.</p>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 snow-scrollbar">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const sessionTranscripts = getTranscriptBySessionId(session.id);
              const isReviewed = reviewedSessionIds.includes(session.id);

              return (
                <button
                    key={session.id}
                    type="button"
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                    "snow-focus-ring snow-interactive-card flex flex-col gap-1 rounded-[var(--radius-md)] p-4 text-left",
                    isActive
                      ? "border border-snow-primary bg-snow-primary-soft"
                      : "border border-snow-border bg-snow-surface hover:bg-snow-surface-soft",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-snow-primary-dark">{formatSnowDateTime(session.date)}</span>
                    {isReviewed ? <CheckCircle2 className="size-4 text-snow-success" /> : null}
                  </span>
                  <span className="snow-body-small snow-font-readable font-semibold text-snow-muted">Topic: {session.title}</span>
                  <span
                    className={cn(
                      "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                      isActive ? "bg-snow-surface text-snow-primary-dark" : "bg-snow-surface-soft text-snow-muted",
                    )}
                  >
                    <MessageSquare className="size-3" /> {sessionTranscripts.length} messages
                  </span>
                </button>
              );
            })}
          </div>
        </SnowCard>

        <SnowCard className="flex min-h-[500px] min-w-0 flex-col overflow-hidden">
          {activeSession ? (
            <>
              <div className="border-b border-snow-border bg-snow-surface-soft px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="snow-heading text-[1.15rem] font-black text-snow-primary-dark">{formatSnowDateTime(activeSession.date)}</h2>
                    <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
                      Duration: {activeSession.durationMinutes} mins - Topic: {activeSession.title}
                    </p>
                  </div>
                  <SnowButton
                    variant={activeReviewed ? "soft" : "primary"}
                    className="min-h-9 px-3 text-xs"
                    onClick={() => setReviewedSessionIds((ids) => activeReviewed ? ids.filter((id) => id !== activeSession.id) : [...ids, activeSession.id])}
                  >
                    <CheckCircle2 className="size-4" />
                    {activeReviewed ? "Reviewed" : "Mark reviewed"}
                  </SnowButton>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Messages", `${transcripts.length}`],
                    ["Sharing", "Parent-only"],
                    ["Suggested read", "Opening and pacing"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[var(--radius-md)] bg-snow-surface px-3 py-2">
                      <p className="text-[11px] font-black text-snow-muted">{label}</p>
                      <p className="mt-1 text-xs font-black text-snow-primary-dark">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6">
                {transcripts.length > 0 ? (
                  <div className="mx-auto grid w-full max-w-[920px] gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="flex flex-col gap-5">
                      {transcripts.map((message) => {
                        const isSnow = message.speaker === "snow";

                        return (
                          <div key={message.id} className={cn("flex items-start gap-3", !isSnow && "justify-end")}>
                            <div className={cn("relative mt-1 size-8 shrink-0 overflow-hidden rounded-full border border-snow-border", isSnow && "bg-white")}>
                              <Image src={isSnow ? "/images/snow-avatar-final.png" : child.avatarUrl || "/images/snow-avatar-final.png"} alt={message.speaker} fill sizes="32px" className="object-cover" />
                            </div>
                            <div className={cn("flex max-w-[78%] flex-col", !isSnow && "order-first items-end")}>
                              <span className={cn("text-xs font-bold text-snow-muted", isSnow ? "ml-1" : "mr-1")}>{isSnow ? "AgentKid" : child.name}</span>
                              <div
                                className={cn(
                                  "snow-font-readable mt-1 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-semibold leading-6 md:text-[15px]",
                                  isSnow ? "bg-snow-surface-soft text-snow-primary-dark" : "bg-snow-primary text-white",
                                )}
                              >
                                <p>{message.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid gap-3 self-start xl:sticky xl:top-4">
                      <div className="rounded-[var(--radius-lg)] bg-snow-ice p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Reading lens</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Look for openings, transitions, and what helped the child stay with the session.</p>
                      </div>
                      <div className="rounded-[var(--radius-lg)] bg-snow-primary-soft p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Good next step</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Keep tomorrow&apos;s first prompt familiar, then move into one short lesson.</p>
                      </div>
                      <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Sharing rule</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">These excerpts are parent-only and remain observational.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[var(--radius-lg)] bg-snow-surface-soft text-sm font-bold text-snow-muted">
                    No transcript available for this session.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-snow-muted">Select a session to view transcripts.</div>
          )}
        </SnowCard>
        <aside className="space-y-4">
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">How to read this</h2>
            <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">These are parent-safe excerpts. They support follow-up and context, not diagnosis or scoring.</p>
          </SnowCard>
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Good next step</h2>
            <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">Look for patterns in openings, pacing, and transitions before changing the child&apos;s routine.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
