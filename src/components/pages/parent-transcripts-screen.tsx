"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  CalendarClock,
  Download,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getTranscripts, CompanionApiError } from "@/lib/companion-client";
import type { ApiTranscriptMessage } from "@/lib/companion-client";
import { formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

export type SyntheticSession = {
  id: string;
  messageCount: number;
  firstAt: string;
};

export function groupBySession(messages: ApiTranscriptMessage[]): Map<string, ApiTranscriptMessage[]> {
  const map = new Map<string, ApiTranscriptMessage[]>();
  for (const msg of messages) {
    if (!map.has(msg.sessionId)) map.set(msg.sessionId, []);
    map.get(msg.sessionId)!.push(msg);
  }
  return map;
}

export function buildSyntheticSessions(grouped: Map<string, ApiTranscriptMessage[]>): SyntheticSession[] {
  return Array.from(grouped.entries()).map(([sessionId, msgs]) => ({
    id: sessionId,
    messageCount: msgs.length,
    firstAt: msgs[0]?.createdAt ?? new Date().toISOString(),
  }));
}

// ── Inner Component ───────────────────────────────────────────────────────────

function ParentTranscriptsContent({
  childId,
  initialSessionId,
}: {
  childId: string;
  initialSessionId?: string;
}) {
  const searchParams = useSearchParams();
  const sessionParam = initialSessionId ?? searchParams?.get("session") ?? null;

  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<ApiTranscriptMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFetch = async () => {
    if (!childId || !childId.trim()) {
      setErrorMessage("childId is required to fetch transcripts");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const msgs = await getTranscripts(childId);
      setAllMessages(msgs);
      const grp = groupBySession(msgs);
      if (sessionParam && grp.has(sessionParam)) {
        setActiveSessionId(sessionParam);
      } else {
        const firstSessionId = grp.keys().next().value;
        if (firstSessionId) setActiveSessionId(firstSessionId);
      }
      setStatus("ready");
    } catch (e: unknown) {
      setErrorMessage(
        e instanceof CompanionApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load transcripts",
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadTranscripts() {
      if (!childId || !childId.trim()) {
        if (cancelled) return;
        setErrorMessage("childId is required to fetch transcripts");
        setStatus("error");
        return;
      }

      try {
        const msgs = await getTranscripts(childId);
        if (cancelled) return;
        setAllMessages(msgs);
        const grp = groupBySession(msgs);
        if (sessionParam && grp.has(sessionParam)) {
          setActiveSessionId(sessionParam);
        } else {
          const firstSessionId = grp.keys().next().value;
          if (firstSessionId) setActiveSessionId(firstSessionId);
        }
        setStatus("ready");
      } catch (e: unknown) {
        if (cancelled) return;
        setErrorMessage(
          e instanceof CompanionApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Failed to load transcripts",
        );
        setStatus("error");
      }
    }

    void loadTranscripts();
    return () => {
      cancelled = true;
    };
  }, [childId, sessionParam]);

  const grouped = groupBySession(allMessages);
  const sessions = buildSyntheticSessions(grouped);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null;
  const transcripts = activeSession ? (grouped.get(activeSession.id) ?? []) : [];

  // Client-side search filter
  const filteredTranscripts = searchQuery.trim()
    ? transcripts.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : transcripts;

  function handleRetry() {
    void handleFetch();
  }

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow="Child records"
        title="Transcripts"
        description="Review parent-safe conversation excerpts between the child and AgentKid. These notes are for observation and follow-up only."
        action={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-snow-muted" />
              <input
                type="text"
                aria-label="Search parent-safe conversation records"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="snow-font-readable h-11 w-full min-w-[260px] rounded-full border border-snow-border bg-snow-surface pl-9 pr-4 text-sm font-semibold outline-none transition focus:border-snow-primary focus:ring-2 focus:ring-snow-primary-soft"
              />
            </div>
            <SnowButton
              variant="soft"
              disabled
              aria-disabled="true"
              title="Export not yet available"
            >
              <Download className="mr-2 size-4" />
              Export
            </SnowButton>
          </div>
        }
      />

      {/* Status tiles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusTile
          label="Child profile"
          value={childId ? `Child (${childId})` : "Unspecified"}
          detail="Route profile"
          icon={<ShieldCheck className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label="Latest session"
          value={activeSession ? `Session ${activeSession.id.slice(-6)}` : "No session"}
          detail={activeSession ? formatSnowDateTime(activeSession.firstAt) : "Select a session"}
          icon={<CalendarClock className="size-5 text-snow-primary" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label="Stored transcript"
          value={`${transcripts.length} messages`}
          detail="Preview only"
          icon={<MessageSquare className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
        <StatusTile
          label="Sharing"
          value="Parent-only"
          detail="No child-facing export controls"
          tone="bg-snow-cream"
        />
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading transcripts"
          className="flex min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface"
        >
          <div className="flex flex-col items-center gap-3 text-snow-muted">
            <Loader2 className="size-8 animate-spin text-snow-primary" />
            <p className="text-sm font-bold">Loading transcripts…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          role="alert"
          className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-8"
        >
          <AlertCircle className="size-8 text-snow-danger" />
          <p className="text-sm font-bold text-snow-danger">{errorMessage}</p>
          <SnowButton onClick={handleRetry}>
            <RefreshCw className="size-4" />
            Try again
          </SnowButton>
        </div>
      )}

      {/* Ready */}
      {status === "ready" && sessions.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-8 text-center">
          <MessageSquare className="size-10 text-snow-muted/60" />
          <h2 className="snow-heading text-lg font-black text-snow-primary-dark">No transcripts yet</h2>
          <p className="snow-body-copy snow-font-readable max-w-[420px] font-semibold text-snow-muted">
            Conversation records between the child and AgentKid will appear here once sessions take place.
          </p>
        </div>
      )}

      {status === "ready" && sessions.length > 0 && (
        <div className="grid items-stretch gap-5 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          {/* Session list panel */}
          <SnowCard className="flex min-h-[500px] flex-col overflow-hidden p-3">
            <div className="border-b border-snow-border px-2 pb-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="snow-heading text-[1.05rem] font-black text-snow-primary-dark">
                  Session list
                </h2>
                <span className="rounded-full bg-snow-primary-soft px-2.5 py-1 text-xs font-black text-snow-primary-dark">
                  {sessions.length} records
                </span>
              </div>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                Choose one conversation to inspect.
              </p>
            </div>
            <div className="snow-scrollbar mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;

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
                      <span className="text-sm font-black text-snow-primary-dark">
                        {formatSnowDateTime(session.firstAt)}
                      </span>
                    </span>
                    <span className="snow-body-small snow-font-readable font-semibold text-snow-muted">
                      Session ID: …{session.id.slice(-8)}
                    </span>
                    <span
                      className={cn(
                        "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                        isActive
                          ? "bg-snow-surface text-snow-primary-dark"
                          : "bg-snow-surface-soft text-snow-muted",
                      )}
                    >
                      <MessageSquare className="size-3" />
                      {session.messageCount} messages
                    </span>
                  </button>
                );
              })}
            </div>
          </SnowCard>

          {/* Transcript viewer panel */}
          <SnowCard className="flex min-h-[500px] min-w-0 flex-col overflow-hidden">
            {activeSession ? (
              <>
                <div className="border-b border-snow-border bg-snow-surface-soft px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="snow-heading text-[1.15rem] font-black text-snow-primary-dark">
                        {formatSnowDateTime(activeSession.firstAt)}
                      </h2>
                      <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
                        Session ID: {activeSession.id}
                      </p>
                    </div>
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
                  {filteredTranscripts.length > 0 ? (
                    <div className="mx-auto grid w-full max-w-[920px] gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="flex flex-col gap-5">
                        {filteredTranscripts.map((message) => {
                          const isSnow = message.role === "assistant";
                          return (
                            <div
                              key={message.id}
                              className={cn("flex items-start gap-3", !isSnow && "justify-end")}
                            >
                              <div
                                className={cn(
                                  "relative mt-1 size-8 shrink-0 overflow-hidden rounded-full border border-snow-border grid place-items-center text-xs font-black",
                                  isSnow ? "bg-white" : "bg-snow-primary-soft text-snow-primary-dark",
                                )}
                              >
                                {isSnow ? (
                                  <Image
                                    src="/images/snow-avatar-final.png"
                                    alt="AgentKid"
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <span>C</span>
                                )}
                              </div>
                              <div className={cn("flex max-w-[78%] flex-col", !isSnow && "order-first items-end")}>
                                <span className={cn("text-xs font-bold text-snow-muted", isSnow ? "ml-1" : "mr-1")}>
                                  {isSnow ? "AgentKid" : "Child"}
                                </span>
                                <div
                                  className={cn(
                                    "snow-font-readable mt-1 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-semibold leading-6 md:text-[15px]",
                                    isSnow
                                      ? "bg-snow-surface-soft text-snow-primary-dark"
                                      : "bg-snow-primary text-white",
                                  )}
                                >
                                  <p>{message.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid gap-3 self-start xl:sticky xl:top-4">
                        <div className="rounded-[var(--radius-lg)] bg-snow-ice p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-snow-muted">
                            Reading lens
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            Look for openings, transitions, and what helped the child stay with the session.
                          </p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-snow-primary-soft p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-snow-muted">
                            Good next step
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            Keep tomorrow&apos;s first prompt familiar, then move into one short lesson.
                          </p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-snow-muted">
                            Sharing rule
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            These excerpts are parent-only and remain observational.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-[var(--radius-lg)] bg-snow-surface-soft text-sm font-bold text-snow-muted">
                      {searchQuery.trim()
                        ? "No messages match your search."
                        : "No transcript available for this session."}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-snow-muted">
                Select a session to view transcripts.
              </div>
            )}
          </SnowCard>

          {/* Aside */}
          <aside className="space-y-4">
            <SnowCard className="snow-card-pad">
              <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">
                How to read this
              </h2>
              <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">
                These are parent-safe excerpts. They support follow-up and context, not diagnosis or scoring.
              </p>
            </SnowCard>
            <SnowCard className="snow-card-pad">
              <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">
                Good next step
              </h2>
              <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">
                Look for patterns in openings, pacing, and transitions before changing the child&apos;s routine.
              </p>
            </SnowCard>
          </aside>
        </div>
      )}
    </ParentPageFrame>
  );
}

export function ParentTranscriptsScreen(props: { childId: string; initialSessionId?: string }) {
  return (
    <Suspense
      fallback={
        <ParentPageFrame className="space-y-4">
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading transcripts"
            className="flex min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface"
          >
            <div className="flex flex-col items-center gap-3 text-snow-muted">
              <Loader2 className="size-8 animate-spin text-snow-primary" />
              <p className="text-sm font-bold">Loading transcripts…</p>
            </div>
          </div>
        </ParentPageFrame>
      }
    >
      <ParentTranscriptsContent {...props} />
    </Suspense>
  );
}
