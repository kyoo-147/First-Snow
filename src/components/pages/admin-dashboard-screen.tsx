"use client";
import { t } from "@/i18n";

import { useEffect, useState } from "react";
import { Activity, Bot, ClipboardList, Database, FileClock, ShieldCheck, Users } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";
import { AdminApiError, fetchAdminDashboard, type AdminDashboard } from "@/lib/admin-client";

type AdminView = "dashboard" | "companion" | "vision" | "system";

export function AdminDashboardScreen({ view = "dashboard" }: { view?: AdminView }) {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof AdminApiError ? cause.message : t("parent", "admin.dashboard.errorFallback"));
      });
    return () => {
      active = false;
    };
  }, []);

  const title = view === "dashboard" ? t("parent", "admin.dashboard.title") : view === "companion" ? t("parent", "admin.dashboard.companionTitle") : view === "vision" ? t("parent", "admin.dashboard.visionTitle") : t("parent", "admin.dashboard.systemTitle");
  const description = view === "dashboard"
    ? t("parent", "admin.dashboard.desc")
    : view === "companion"
      ? t("parent", "admin.dashboard.companionDesc")
      : view === "vision"
        ? t("parent", "admin.dashboard.visionDesc")
        : t("parent", "admin.dashboard.systemDesc");

  return (
    <div className="snow-font-ui mx-auto max-w-[var(--page-max)] space-y-[var(--section-gap)]">
      <header>
        <p className="text-xs font-black uppercase tracking-wide text-snow-primary">{t("parent", "admin.dashboard.badge")}</p>
        <h1 className="snow-title-compact mt-2 font-black text-snow-primary-dark">{title}</h1>
        <p className="snow-body-copy snow-font-readable mt-2 max-w-[760px] font-semibold text-snow-muted">{description}</p>
      </header>

      {error ? <AdminState title={t("parent", "admin.dashboard.errorTitle")} detail={error} tone="error" /> : !data ? <AdminState title={t("parent", "admin.dashboard.loadingTitle")} detail={t("parent", "admin.dashboard.loadingDetail")} tone="loading" /> : <AdminContent data={data} view={view} />}
    </div>
  );
}

function AdminContent({ data, view }: { data: AdminDashboard; view: AdminView }) {
  if (view === "dashboard") {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label={t("parent", "admin.dashboard.metrics.users")} value={data.counts.users} detail={t("parent", "admin.dashboard.metrics.usersDetail")} icon={<Users className="size-5 text-snow-primary-dark" />} tone="bg-snow-primary-soft" />
          <AdminStatCard label={t("parent", "admin.dashboard.metrics.children")} value={data.counts.children} detail={t("parent", "admin.dashboard.metrics.childrenDetail")} icon={<ShieldCheck className="size-5 text-snow-primary-dark" />} tone="bg-snow-ice" />
          <AdminStatCard label={t("parent", "admin.dashboard.metrics.activeSessions")} value={data.counts.activeSessions} detail={t("parent", "admin.dashboard.metrics.activeSessionsDetail")} icon={<Activity className="size-5 text-snow-primary-dark" />} tone="bg-snow-lavender" />
          <AdminStatCard label={t("parent", "admin.dashboard.metrics.households")} value={data.counts.households} detail={t("parent", "admin.dashboard.metrics.householdsDetail")} icon={<Database className="size-5 text-snow-primary-dark" />} tone="bg-snow-cream" />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <AuditCard rows={data.recentAudit} />
          <JobsCard rows={data.recentJobs} />
        </div>
        <ProviderCard />
      </>
    );
  }

  if (view === "companion") {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.cards.companionActivity")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MetricRow label={t("parent", "admin.dashboard.metrics.companionSessions")} value={data.counts.companionSessions} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.activeSessions")} value={data.counts.activeSessions} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.lessonAttempts")} value={data.counts.lessonAttempts} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.providerHealth")} value={t("parent", "admin.dashboard.metrics.notRecorded")} />
          </div>
        </SnowCard>
        <ProviderCard />
      </div>
    );
  }

  if (view === "vision") {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.cards.availableRecords")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MetricRow label={t("parent", "admin.dashboard.metrics.households")} value={data.counts.households} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.children")} value={data.counts.children} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.recentAuditEvents")} value={data.recentAudit.length} />
            <MetricRow label={t("parent", "admin.dashboard.metrics.providerHealth")} value={t("parent", "admin.dashboard.metrics.notRecorded")} />
          </div>
          <p className="snow-body-copy snow-font-readable mt-5 rounded-[var(--radius-md)] bg-snow-surface-soft p-4 font-semibold text-snow-muted">{t("parent", "admin.dashboard.cards.visionNote")}</p>
        </SnowCard>
        <AuditCard rows={data.recentAudit} />
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <JobsCard rows={data.recentJobs} />
      <AuditCard rows={data.recentAudit} />
      <SnowCard className="snow-card-pad">
        <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.cards.operationalCounts")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MetricRow label={t("parent", "admin.dashboard.metrics.users")} value={data.counts.users} />
          <MetricRow label={t("parent", "admin.dashboard.metrics.activeSessions")} value={data.counts.activeSessions} />
          <MetricRow label={t("parent", "admin.dashboard.metrics.lessonAttempts")} value={data.counts.lessonAttempts} />
          <MetricRow label={t("parent", "admin.dashboard.metrics.companionSessions")} value={data.counts.companionSessions} />
        </div>
      </SnowCard>
      <ProviderCard />
    </div>
  );
}

function AdminState({ title, detail, tone }: { title: string; detail: string; tone: "loading" | "error" }) {
  return (
    <div role={tone === "error" ? "alert" : "status"}>
      <SnowCard className={cn("snow-card-pad", tone === "error" && "border-snow-warning/50")}>
        <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{title}</h2>
        <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">{detail}</p>
      </SnowCard>
    </div>
  );
}

function AdminStatCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: React.ReactNode; tone: string }) {
  return <SnowCard className="snow-card-pad"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">{label}</p><p className="mt-3 text-[clamp(1.45rem,1.55vw,1.8rem)] font-black leading-tight text-snow-primary-dark">{value}</p><p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">{detail}</p></div><div className={cn("grid size-11 shrink-0 place-items-center rounded-full", tone)}>{icon}</div></div></SnowCard>;
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"><p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">{label}</p><p className="mt-1 text-sm font-black text-snow-primary-dark">{value}</p></div>;
}

function AuditCard({ rows }: { rows: AdminDashboard["recentAudit"] }) {
  return <SnowCard className="snow-card-pad"><div className="flex items-center gap-2"><ClipboardList className="size-5 text-snow-primary" /><h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.metrics.recentAuditEvents")}</h2></div>{rows.length === 0 ? <EmptyState detail={t("parent", "admin.dashboard.cards.noAudit")} /> : <div className="mt-4 space-y-3">{rows.map((row) => <div key={row.id} className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-snow-primary-dark">{row.eventType}</p><time className="snow-font-mono text-xs text-snow-muted" dateTime={row.createdAt}>{formatDate(row.createdAt)}</time></div><p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{[row.actorType, row.resourceType].filter(Boolean).join(" · ") || t("parent", "admin.dashboard.cards.noActor")}</p></div>)}</div>}</SnowCard>;
}

function JobsCard({ rows }: { rows: AdminDashboard["recentJobs"] }) {
  return <SnowCard className="snow-card-pad"><div className="flex items-center gap-2"><FileClock className="size-5 text-snow-primary" /><h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.metrics.recentDataJobs")}</h2></div>{rows.length === 0 ? <EmptyState detail={t("parent", "admin.dashboard.cards.noJobs")} /> : <div className="mt-4 space-y-3">{rows.map((row) => <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"><div className="min-w-0"><p className="text-sm font-black capitalize text-snow-primary-dark">{t("parent", "admin.dashboard.cards.jobLabel", { kind: row.kind })}</p><p className="snow-body-small snow-font-readable mt-1 text-xs text-snow-muted">{t("parent", "admin.dashboard.cards.jobStatus", { status: row.status })}</p></div><span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black capitalize text-snow-primary-dark">{row.status}</span></div>)}</div>}</SnowCard>;
}

function ProviderCard() {
  return <SnowCard className="snow-card-pad"><div className="flex items-center gap-2"><Bot className="size-5 text-snow-primary" /><h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">{t("parent", "admin.dashboard.metrics.providerHealth")}</h2></div><div className="mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4"><p className="text-sm font-black text-snow-primary-dark">{t("parent", "admin.dashboard.metrics.notRecorded")}</p><p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{t("parent", "admin.dashboard.cards.providerHealthNote")}</p></div></SnowCard>;
}

function EmptyState({ detail }: { detail: string }) { return <p className="snow-body-copy snow-font-readable mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4 font-semibold text-snow-muted">{detail}</p>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? t("parent", "admin.dashboard.cards.unknownTime") : date.toLocaleString(); }
