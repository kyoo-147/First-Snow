"use client";
import { t } from "@/i18n";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, CheckCircle2, ShieldAlert } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import {
  fetchDashboardAlert,
  fetchHouseholdChildren,
  getErrorMessage,
  markDashboardAlertRead,
  type DashboardAlert,
  type DashboardChild,
} from "@/lib/dashboard-client";
import { formatSnowDate, formatSnowTime } from "@/lib/format";

const SEVERITY_LABELS: Record<string, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

export function ParentAlertDetailScreen({
  alertId,
  initialAlert,
  initialChild,
}: {
  alertId: string;
  initialAlert?: DashboardAlert | null;
  initialChild?: DashboardChild | null;
}) {
  const [alert, setAlert] = useState<DashboardAlert | null>(initialAlert ?? null);
  const [child, setChild] = useState<DashboardChild | null>(initialChild ?? null);
  const [loading, setLoading] = useState(!initialAlert || !initialChild);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAlert && initialChild) return;
    let cancelled = false;
    Promise.all([fetchDashboardAlert(alertId), fetchHouseholdChildren()])
      .then(([foundAlert, children]) => {
        if (cancelled) return;
        const foundChild = children.find((item) => item.id === foundAlert.childId) ?? null;
        if (!foundChild) throw new Error(t("parent", "alertDetail.errorNoChild"));
        setAlert(foundAlert);
        setChild(foundChild);
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
  }, [alertId]);

  async function markReviewed() {
    if (!alert || alert.readAt) return;
    setSaving(true);
    setError(null);
    try {
      setAlert(await markDashboardAlertRead(alert.id));
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ParentPageFrame><SnowCard className="p-8 text-center"><p role="status">{t("parent", "alertDetail.loading")}</p></SnowCard></ParentPageFrame>;
  }

  if (!alert || !child) {
    return (
      <ParentPageFrame>
        <SnowCard className="p-8 text-center">
          <div role="alert">
          <h1 className="text-xl font-black text-snow-primary-dark">{t("parent", "alertDetail.errorUnavailable")}</h1>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error ?? t("parent", "alertDetail.errorNoReview")}</p>
          <Link href="/parent/alerts" className="mt-4 inline-flex text-sm font-black text-snow-primary">{t("parent", "alertDetail.returnToReviews")}</Link>
          </div>
        </SnowCard>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "alertDetail.eyebrow")}
        title={alert.title}
        description={`${t("parent", "alertDetail.description1")}${child.name}${t("parent", "alertDetail.description2")}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label={t("parent", "alertDetail.priority")} value={SEVERITY_LABELS[alert.severity] ?? alert.severity} detail={alert.readAt ? t("parent", "alertDetail.reviewed") : t("parent", "alertDetail.needsReview")} icon={<ShieldAlert className="size-5 text-snow-primary" />} />
        <StatusTile label={t("parent", "alertDetail.child")} value={child.name} detail={[child.age ? `${t("parent", "alertDetail.age")} ${child.age}` : null, child.grade].filter(Boolean).join(" · ") || t("parent", "alertDetail.profileUnavailable")} icon={<Bell className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label={t("parent", "alertDetail.logged")} value={formatSnowDate(alert.createdAt)} detail={formatSnowTime(alert.createdAt)} icon={<CalendarClock className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      {error ? <SnowCard className="border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"><p role="alert">{error}</p></SnowCard> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SnowCard className="p-5">
          <h2 className="text-xl font-black text-snow-primary-dark">{t("parent", "alertDetail.persistedObservation")}</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-snow-muted">{alert.description}</p>
          <div className="mt-5 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
            <p className="text-sm font-black text-snow-primary-dark">{t("parent", "alertDetail.caregiverNextStep")}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">{t("parent", "alertDetail.stepDesc1")}{child.name}{t("parent", "alertDetail.stepDesc2")}</p>
          </div>
        </SnowCard>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "alertDetail.reviewActions")}</h2>
            <div className="mt-4 space-y-3">
              <SnowButton className="w-full justify-center" variant={alert.readAt ? "soft" : "primary"} disabled={saving || Boolean(alert.readAt)} onClick={() => void markReviewed()}>
                <CheckCircle2 className="mr-2 size-4" /> {alert.readAt ? t("parent", "alertDetail.reviewed") : saving ? t("parent", "alertDetail.saving") : t("parent", "alertDetail.markReviewed")}
              </SnowButton>
              {alert.linkedSessionId ? (
                <Link href={`/parent/children/${encodeURIComponent(child.id)}/transcripts?session=${encodeURIComponent(alert.linkedSessionId)}`} className="snow-focus-ring block rounded-full border border-snow-border bg-snow-surface-soft px-4 py-3 text-center text-sm font-black text-snow-primary-dark">
                  {t("parent", "alertDetail.openTranscript")}
                </Link>
              ) : <p className="text-xs font-semibold text-snow-muted">{t("parent", "alertDetail.noTranscript")}</p>}
              <Link href={`/parent/children/${encodeURIComponent(child.id)}/routines`} className="snow-focus-ring block rounded-full border border-snow-border bg-snow-surface-soft px-4 py-3 text-center text-sm font-black text-snow-primary-dark">
                {t("parent", "alertDetail.reviewRoutine")}
              </Link>
            </div>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
