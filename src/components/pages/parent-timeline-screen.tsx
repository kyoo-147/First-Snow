"use client";
import { t } from "@/i18n";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookCheck, CalendarClock, RefreshCw } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import {
  fetchDashboardAlerts,
  fetchDashboardAttempts,
  fetchHouseholdChildren,
  getErrorMessage,
  type DashboardAlert,
  type DashboardAttempt,
  type DashboardChild,
} from "@/lib/dashboard-client";
import { formatSnowDateTime } from "@/lib/format";

type TimelineEvent = {
  id: string;
  kind: "lesson" | "alert";
  title: string;
  detail: string;
  occurredAt: string;
  href: string;
};

export function ParentTimelineScreen({ childId }: { childId: string }) {
  const [child, setChild] = useState<DashboardChild | null>(null);
  const [attempts, setAttempts] = useState<DashboardAttempt[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchHouseholdChildren(),
      fetchDashboardAttempts(childId),
      fetchDashboardAlerts(childId),
    ])
      .then(([children, attemptRows, alertRows]) => {
        if (cancelled) return;
        const ownedChild = children.find((item) => item.id === childId) ?? null;
        if (!ownedChild) throw new Error(t("parent", "timeline.unavailableProfile"));
        setChild(ownedChild);
        setAttempts(attemptRows);
        setAlerts(alertRows);
      })
      .catch((cause) => {
        if (!cancelled) setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childId, reloadKey]);

  const events = useMemo<TimelineEvent[]>(() => {
    const lessonEvents = attempts
      .filter((attempt) => attempt.status === "completed" && attempt.completedAt)
      .map((attempt) => ({
        id: `lesson-${attempt.id}`,
        kind: "lesson" as const,
        title: t("parent", "timeline.lessonCompleted"),
        detail: attempt.lessonTitle,
        occurredAt: attempt.completedAt as string,
        href: `/parent/children/${encodeURIComponent(childId)}/learning`,
      }));
    const alertEvents = alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      kind: "alert" as const,
      title: alert.readAt ? t("parent", "timeline.safetyChecked") : t("parent", "timeline.safetyNeedsAttention"),
      detail: alert.description,
      occurredAt: alert.createdAt,
      href: `/parent/alerts/${encodeURIComponent(alert.id)}`,
    }));
    return [...lessonEvents, ...alertEvents].sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
  }, [alerts, attempts, childId]);

  const completedLessons = attempts.filter((attempt) => attempt.status === "completed").length;
  const unreadAlerts = alerts.filter((alert) => !alert.readAt).length;

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={child ? t("parent", "timeline.timelineFor", { name: child.name }) : t("parent", "timeline.activityTimeline")}
        title={t("parent", "timeline.recordedActivity")}
        description={t("parent", "timeline.recordedDesc")}
        action={
          <SnowButton variant="soft" onClick={() => { setLoading(true); setError(null); setReloadKey((value) => value + 1); }} disabled={loading}>
            <RefreshCw className="mr-2 size-4" /> {t("parent", "account.refresh")}
          </SnowButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label={t("parent", "timeline.completedLessons")} value={loading ? "—" : `${completedLessons}`} detail={t("parent", "timeline.persistedAttempts")} icon={<BookCheck className="size-5 text-snow-primary" />} />
        <StatusTile label={t("parent", "timeline.safetyReviews")} value={loading ? "—" : `${alerts.length}`} detail={t("parent", "timeline.persistedFlagged")} icon={<AlertTriangle className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label={t("parent", "timeline.needsReview")} value={loading ? "—" : `${unreadAlerts}`} detail={t("parent", "timeline.unreadSafety")} icon={<CalendarClock className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      {loading ? <SnowCard className="p-8 text-center"><p role="status">{t("parent", "timeline.loading")}</p></SnowCard> : null}
      {!loading && error ? (
        <SnowCard className="p-8 text-center">
          <div role="alert">
          <h2 className="text-xl font-black text-snow-primary-dark">{t("parent", "timeline.unavailable")}</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          </div>
        </SnowCard>
      ) : null}
      {!loading && !error && events.length === 0 ? (
        <SnowCard className="p-8 text-center">
          <h2 className="text-xl font-black text-snow-primary-dark">{t("parent", "timeline.noActivity")}</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{t("parent", "timeline.noActivityDesc")}</p>
        </SnowCard>
      ) : null}
      {!loading && !error && events.length > 0 ? (
        <SnowCard className="p-5">
          <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "timeline.latestFirst")}</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={event.href} className="snow-focus-ring block rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4 transition hover:border-snow-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-snow-primary-dark">{event.title}</p>
                    <p className="mt-1 text-sm font-semibold text-snow-muted">{event.detail}</p>
                  </div>
                  <span className="text-xs font-black text-snow-muted">{formatSnowDateTime(event.occurredAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </SnowCard>
      ) : null}
    </ParentPageFrame>
  );
}
