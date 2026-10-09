"use client";
import { t } from "@/i18n";

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

export function formatTranscriptStatusTiles(
  status: "loading" | "error" | "ready",
  activeSession: SyntheticSession | null,
  transcriptsCount: number,
) {
  const isReady = status === "ready";
  return {
    latestSession: {
      value: isReady
        ? activeSession
          ? `${t("parent", "transcripts.session")} ${activeSession.id.slice(-6)}`
          : t("parent", "transcripts.noSessions")
        : "—",
      detail: isReady
        ? activeSession
          ? formatSnowDateTime(activeSession.firstAt)
          : t("parent", "transcripts.noSessionRecords")
        : t("parent", "transcripts.statusUnavailable"),
    },
    storedTranscript: {
      value: isReady ? t("parent", "transcripts.messagesCount", { count: transcriptsCount }) : "—",
      detail: isReady ? t("parent", "transcripts.recordsForSession") : t("parent", "transcripts.statusUnavailable"),
    },
  };
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
      setErrorMessage(t("parent", "transcripts.errorChildId"));
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
            : t("parent", "transcripts.errorLoad"),
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadTranscripts() {
      if (!childId || !childId.trim()) {
        if (cancelled) return;
        setErrorMessage(t("parent", "transcripts.errorChildId"));
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
              : t("parent", "transcripts.errorLoad"),
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

  const tileData = formatTranscriptStatusTiles(status, activeSession, transcripts.length);

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow={t("parent", "transcripts.childRecords")}
        title={t("parent", "transcripts.title")}
        description={t("parent", "transcripts.desc")}
        action={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-snow-muted" />
              <input
                type="text"
                aria-label={t("parent", "transcripts.searchAria")}
                placeholder={t("parent", "transcripts.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="snow-font-readable h-11 w-full min-w-[260px] rounded-full border border-snow-border bg-snow-surface pl-9 pr-4 text-sm font-semibold outline-none transition focus:border-snow-primary focus:ring-2 focus:ring-snow-primary-soft"
              />
            </div>
            <SnowButton
              variant="soft"
              disabled
              aria-disabled="true"
              title={t("parent", "transcripts.exportNotAvailable")}
            >
              <Download className="mr-2 size-4" />
              {t("parent", "transcripts.export")}
            </SnowButton>
          </div>
        }
      />

      {/* Status tiles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusTile
          label={t("parent", "transcripts.childProfile")}
          value={childId ? `${t("parent", "transcripts.child")} (${childId})` : t("parent", "transcripts.unspecified")}
          detail={t("parent", "transcripts.routeProfile")}
          icon={<ShieldCheck className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label={t("parent", "transcripts.latestSession")}
          value={tileData.latestSession.value}
          detail={tileData.latestSession.detail}
          icon={<CalendarClock className="size-5 text-snow-primary" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label={t("parent", "transcripts.storedTranscript")}
          value={tileData.storedTranscript.value}
          detail={tileData.storedTranscript.detail}
          icon={<MessageSquare className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
        <StatusTile
          label={t("parent", "transcripts.sharing")}
          value={t("parent", "transcripts.parentOnly")}
          detail={t("parent", "transcripts.noChildExport")}
          tone="bg-snow-cream"
        />
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div
          role="status"
          aria-busy="true"
          aria-label={t("parent", "transcripts.loadingAria")}
          className="flex min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface"
        >
          <div className="flex flex-col items-center gap-3 text-snow-muted">
            <Loader2 className="size-8 animate-spin text-snow-primary" />
            <p className="text-sm font-bold">{t("parent", "transcripts.loading")}</p>
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
            {t("parent", "transcripts.tryAgain")}
          </SnowButton>
        </div>
      )}

      {/* Ready */}
      {status === "ready" && sessions.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-8 text-center">
          <MessageSquare className="size-10 text-snow-muted/60" />
          <h2 className="snow-heading text-lg font-black text-snow-primary-dark">{t("parent", "transcripts.noTranscripts")}</h2>
          <p className="snow-body-copy snow-font-readable max-w-[420px] font-semibold text-snow-muted">
            {t("parent", "transcripts.noTranscriptsDesc")}
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
                  {t("parent", "transcripts.sessionList")}
                </h2>
                <span className="rounded-full bg-snow-primary-soft px-2.5 py-1 text-xs font-black text-snow-primary-dark">
                  {t("parent", "transcripts.recordsCount", { count: sessions.length })}
                </span>
              </div>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                {t("parent", "transcripts.chooseSession")}
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
                      {t("parent", "transcripts.sessionId", { id: session.id.slice(-8) })}
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
                      {t("parent", "transcripts.messagesCount", { count: session.messageCount })}
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
                        {t("parent", "transcripts.sessionIdFull", { id: activeSession.id })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      [t("parent", "transcripts.messages"), `${transcripts.length}`],
                      [t("parent", "transcripts.sharing"), t("parent", "transcripts.parentOnly")],
                      [t("parent", "transcripts.suggestedRead"), t("parent", "transcripts.openingPacing")],
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
                                    src="/images/snow-avatar-v2.png"
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
                                  {isSnow ? t("parent", "transcripts.agentKid") : t("parent", "transcripts.child")}
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
                            {t("parent", "transcripts.readingLens")}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            {t("parent", "transcripts.readingLensDesc")}
                          </p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-snow-primary-soft p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-snow-muted">
                            {t("parent", "transcripts.goodNextStep")}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            {t("parent", "transcripts.goodNextStepDesc")}
                          </p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-snow-muted">
                            {t("parent", "transcripts.sharingRule")}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                            {t("parent", "transcripts.sharingRuleDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-[var(--radius-lg)] bg-snow-surface-soft text-sm font-bold text-snow-muted">
                      {searchQuery.trim()
                        ? t("parent", "transcripts.noSearchMatch")
                        : t("parent", "transcripts.noTranscriptAvailable")}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-snow-muted">
                {t("parent", "transcripts.selectSession")}
              </div>
            )}
          </SnowCard>

          {/* Aside */}
          <aside className="space-y-4">
            <SnowCard className="snow-card-pad">
              <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">
                {t("parent", "transcripts.howToRead")}
              </h2>
              <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">
                {t("parent", "transcripts.howToReadDesc")}
              </p>
            </SnowCard>
            <SnowCard className="snow-card-pad">
              <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">
                {t("parent", "transcripts.goodNextStep")}
              </h2>
              <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">
                {t("parent", "transcripts.goodNextStepSidebarDesc")}
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
            aria-label={t("parent", "transcripts.loadingAria")}
            className="flex min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface"
          >
            <div className="flex flex-col items-center gap-3 text-snow-muted">
              <Loader2 className="size-8 animate-spin text-snow-primary" />
              <p className="text-sm font-bold">{t("parent", "transcripts.loading")}</p>
            </div>
          </div>
        </ParentPageFrame>
      }
    >
      <ParentTranscriptsContent {...props} />
    </Suspense>
  );
}
