"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import { getAlertsByChildId, getChildById } from "@/data";
import { formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ParentAlertsScreen() {
  const child = getChildById("minh");
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const alerts = getAlertsByChildId(child.id);

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Safety"
        title="Alerts"
        description={`Parent-only review of moments AgentKid marked for follow-up. Alerts use calm observation language and do not make medical claims.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Active alerts" value={`${alerts.filter((alert) => !alert.isRead && !reviewedIds.includes(alert.id)).length}`} detail="Waiting for parent review" icon={<Bell className="size-5 text-snow-primary" />} />
        <StatusTile label="Urgent alerts" value="0" detail="No immediate action flagged" icon={<ShieldCheck className="size-5 text-snow-success" />} tone="bg-snow-ice" />
        <StatusTile label="Selected child" value={`${child.name}, age ${child.age}`} detail={child.grade} icon={<ShieldAlert className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isReviewed = alert.isRead || reviewedIds.includes(alert.id);
            return (
            <div
              key={alert.id}
              className={cn("rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 shadow-[var(--shadow-card)] transition", isReviewed ? "opacity-80" : "hover:-translate-y-0.5 hover:bg-snow-surface-soft")}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-full text-white",
                      alert.severity === "high" && "bg-snow-danger",
                      alert.severity === "medium" && "bg-snow-warning",
                      alert.severity === "low" && "bg-snow-primary",
                    )}
                  >
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-snow-primary-dark">{alert.title}</h2>
                    <p className="mt-1 max-w-[760px] text-sm font-semibold leading-6 text-snow-muted">{alert.description}</p>
                  </div>
                </div>
                <div className="shrink-0 text-left md:text-right">
                  <p className="text-xs font-bold text-snow-muted">{formatSnowDateTime(alert.date)}</p>
                  <span className="mt-2 inline-flex rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black capitalize text-snow-primary-dark">
                    {alert.severity} priority
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/parent/alerts/${alert.id}`} className="snow-focus-ring inline-flex min-h-10 items-center rounded-full border border-snow-border px-4 text-sm font-black text-snow-primary-dark">
                  Review details
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setReviewedIds((current) =>
                      current.includes(alert.id) ? current.filter((item) => item !== alert.id) : [...current, alert.id],
                    )
                  }
                  className={cn("snow-focus-ring inline-flex min-h-10 items-center rounded-full px-4 text-sm font-black", isReviewed ? "bg-snow-success/15 text-snow-success" : "bg-snow-primary-soft text-snow-primary-dark")}
                >
                  {isReviewed ? "Reviewed" : "Mark reviewed"}
                </button>
              </div>
            </div>
          )})}
        </div>

        <aside className="space-y-4">
          <SnowCard className="bg-snow-lavender p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">How to read alerts</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
              AgentKid surfaces moments worth reviewing. The parent decides whether any follow-up is needed.
            </p>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Current safety posture</h2>
            <div className="mt-4 space-y-3">
              {["Camera preview is off", "Emergency settings are parent-only", "No urgent alerts today"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3">
                  <CheckCircle2 className="size-4 text-snow-success" />
                  <span className="text-sm font-bold text-snow-primary-dark">{item}</span>
                </div>
              ))}
            </div>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Review posture</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">Alerts stay calm and parent-readable. Reviewing them should feel deliberate, not alarming.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
