"use client";

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

export function ParentAlertDetailScreen({ alertId }: { alertId: string }) {
  const [alert, setAlert] = useState<DashboardAlert | null>(null);
  const [child, setChild] = useState<DashboardChild | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchDashboardAlert(alertId), fetchHouseholdChildren()])
      .then(([foundAlert, children]) => {
        if (cancelled) return;
        const foundChild = children.find((item) => item.id === foundAlert.childId) ?? null;
        if (!foundChild) throw new Error("The child profile for this safety review is unavailable.");
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
    return <ParentPageFrame><SnowCard className="p-8 text-center"><p role="status">Loading safety review…</p></SnowCard></ParentPageFrame>;
  }

  if (!alert || !child) {
    return (
      <ParentPageFrame>
        <SnowCard className="p-8 text-center">
          <div role="alert">
          <h1 className="text-xl font-black text-snow-primary-dark">Safety review unavailable</h1>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error ?? "No persisted safety review is available."}</p>
          <Link href="/parent/alerts" className="mt-4 inline-flex text-sm font-black text-snow-primary">Return to safety reviews</Link>
          </div>
        </SnowCard>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Safety review"
        title={alert.title}
        description={`Review the persisted safety signal for ${child.name}. AgentKid does not infer a diagnosis or claim that outside help was contacted.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Priority" value={alert.severity} detail={alert.readAt ? "Reviewed" : "Needs review"} icon={<ShieldAlert className="size-5 text-snow-primary" />} />
        <StatusTile label="Child" value={child.name} detail={[child.age ? `Age ${child.age}` : null, child.grade].filter(Boolean).join(" · ") || "Profile details unavailable"} icon={<Bell className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Logged" value={formatSnowDate(alert.createdAt)} detail={formatSnowTime(alert.createdAt)} icon={<CalendarClock className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      {error ? <SnowCard className="border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"><p role="alert">{error}</p></SnowCard> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SnowCard className="p-5">
          <h2 className="text-xl font-black text-snow-primary-dark">Persisted observation</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-snow-muted">{alert.description}</p>
          <div className="mt-5 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
            <p className="text-sm font-black text-snow-primary-dark">Caregiver next step</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Review the related conversation when available, check in directly with {child.name}, and use your emergency plan if immediate danger is present.</p>
          </div>
        </SnowCard>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Review actions</h2>
            <div className="mt-4 space-y-3">
              <SnowButton className="w-full justify-center" variant={alert.readAt ? "soft" : "primary"} disabled={saving || Boolean(alert.readAt)} onClick={() => void markReviewed()}>
                <CheckCircle2 className="mr-2 size-4" /> {alert.readAt ? "Reviewed" : saving ? "Saving…" : "Mark reviewed"}
              </SnowButton>
              {alert.linkedSessionId ? (
                <Link href={`/parent/children/${encodeURIComponent(child.id)}/transcripts?sessionId=${encodeURIComponent(alert.linkedSessionId)}`} className="snow-focus-ring block rounded-full border border-snow-border bg-snow-surface-soft px-4 py-3 text-center text-sm font-black text-snow-primary-dark">
                  Open related transcript
                </Link>
              ) : <p className="text-xs font-semibold text-snow-muted">No related transcript link is stored.</p>}
              <Link href={`/parent/children/${encodeURIComponent(child.id)}/routines`} className="snow-focus-ring block rounded-full border border-snow-border bg-snow-surface-soft px-4 py-3 text-center text-sm font-black text-snow-primary-dark">
                Review routine timing
              </Link>
            </div>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
