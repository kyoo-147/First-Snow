"use client";
import { t } from "@/i18n";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import {
  getAlerts,
  markAlertRead,
  CompanionApiError,
} from "@/lib/companion-client";
import type { ApiAlert } from "@/lib/companion-client";
import { formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExtendedAlert = ApiAlert & {
  warning?: string;
  isUpdating?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatAlertStatusTiles(
  status: "loading" | "error" | "ready",
  alerts: ApiAlert[],
) {
  const isReady = status === "ready";
  const activeCount = isReady ? alerts.filter((a) => !a.readAt).length : null;
  const urgentCount = isReady
    ? alerts.filter((a) => !a.readAt && a.severity === "high").length
    : null;

  return {
    active: {
      value: isReady ? `${activeCount}` : "—",
      detail: isReady ? t("parent", "alertsScreen.waitingForReview") : t("parent", "alertsScreen.statusUnavailable"),
    },
    urgent: {
      value: isReady ? `${urgentCount}` : "—",
      detail: isReady
        ? urgentCount === 0
          ? t("parent", "alertsScreen.noUrgentAlerts")
          : t("parent", "alertsScreen.highPriorityReview")
        : t("parent", "alertsScreen.statusUnavailable"),
    },
    total: {
      value: isReady ? `${alerts.length}` : "—",
      detail: isReady ? t("parent", "alertsScreen.householdRecords") : t("parent", "alertsScreen.statusUnavailable"),
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParentAlertsScreen() {
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ExtendedAlert[]>([]);

  const handleFetch = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await getAlerts();
      setAlerts(data);
      setStatus("ready");
    } catch (e: unknown) {
      setErrorMessage(
        e instanceof CompanionApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t("parent", "alertsScreen.failedToLoad"),
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const data = await getAlerts();
        if (cancelled) return;
        setAlerts(data);
        setStatus("ready");
      } catch (e: unknown) {
        if (cancelled) return;
        setErrorMessage(
          e instanceof CompanionApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : t("parent", "alertsScreen.failedToLoad"),
        );
        setStatus("error");
      }
    }

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkReviewed = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isUpdating: true } : a)),
    );
    try {
      const updated = await markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, readAt: updated.readAt, isUpdating: false, warning: undefined }
            : a,
        ),
      );
    } catch (e: unknown) {
      if (e instanceof CompanionApiError && e.status === 404) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, isUpdating: false, warning: t("parent", "alertsScreen.alertUnavailable") }
              : a,
          ),
        );
      } else {
        const msg =
          e instanceof CompanionApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : t("parent", "alertsScreen.failedToMark");
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, isUpdating: false, warning: msg } : a,
          ),
        );
      }
    }
  };

  const tileData = formatAlertStatusTiles(status, alerts);

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "alertsScreen.eyebrow")}
        title={t("parent", "alertsScreen.title")}
        description={t("parent", "alertsScreen.description")}
      />

      {/* Status tiles */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          label={t("parent", "alertsScreen.activeAlerts")}
          value={tileData.active.value}
          detail={tileData.active.detail}
          icon={<Bell className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label={t("parent", "alertsScreen.urgentAlerts")}
          value={tileData.urgent.value}
          detail={tileData.urgent.detail}
          icon={<ShieldCheck className="size-5 text-snow-success" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label={t("parent", "alertsScreen.totalAlerts")}
          value={tileData.total.value}
          detail={tileData.total.detail}
          icon={<ShieldAlert className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div
          role="status"
          aria-busy="true"
          aria-label={t("parent", "alertsScreen.loadingAria")}
          className="flex min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface"
        >
          <div className="flex flex-col items-center gap-3 text-snow-muted">
            <Loader2 className="size-8 animate-spin text-snow-primary" />
            <p className="text-sm font-bold">{t("parent", "alertsScreen.loading")}</p>
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
          <SnowButton onClick={() => void handleFetch()}>
            <RefreshCw className="size-4" />
            {t("parent", "alertsScreen.tryAgain")}
          </SnowButton>
        </div>
      )}

      {/* Ready */}
      {status === "ready" && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-8 text-center">
                <CheckCircle2 className="size-10 text-snow-success" />
                <h2 className="snow-heading text-lg font-black text-snow-primary-dark">{t("parent", "alertsScreen.noAlerts")}</h2>
                <p className="snow-body-copy snow-font-readable max-w-[420px] font-semibold text-snow-muted">
                  {t("parent", "alertsScreen.noAlertsDesc")}
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isReviewed = Boolean(alert.readAt);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 shadow-[var(--shadow-card)] transition",
                      isReviewed
                        ? "opacity-80"
                        : "hover:-translate-y-0.5 hover:bg-snow-surface-soft",
                    )}
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
                          <h2 className="text-lg font-black text-snow-primary-dark">
                            {alert.title}
                          </h2>
                          <p className="mt-1 max-w-[760px] text-sm font-semibold leading-6 text-snow-muted">
                            {alert.description}
                          </p>
                          {alert.warning ? (
                            <p className="mt-2 text-xs font-bold text-snow-danger">
                              {alert.warning}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-left md:text-right">
                        <p className="text-xs font-bold text-snow-muted">
                          {formatSnowDateTime(alert.createdAt)}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black capitalize text-snow-primary-dark">
                          {alert.severity} {t("parent", "alertsScreen.priority")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/parent/alerts/${alert.id}`}
                        className="snow-focus-ring inline-flex min-h-10 items-center rounded-full border border-snow-border px-4 text-sm font-black text-snow-primary-dark hover:bg-snow-surface-soft"
                      >
                        {t("parent", "alertsScreen.reviewDetails")}
                      </Link>

                      {alert.linkedSessionId && alert.childId ? (
                        <Link
                          href={`/parent/children/${encodeURIComponent(alert.childId)}/transcripts?session=${encodeURIComponent(alert.linkedSessionId)}`}
                          className="snow-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full border border-snow-border px-4 text-sm font-black text-snow-primary-dark hover:bg-snow-surface-soft"
                        >
                          {t("parent", "alertsScreen.viewSession")}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : null}

                      {isReviewed ? (
                        <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-snow-success/15 px-4 text-sm font-black text-snow-success">
                          <CheckCircle2 className="size-4" />
                          {t("parent", "alertsScreen.reviewed")}
                        </span>
                      ) : (
                        <SnowButton
                          variant="primary"
                          className="min-h-10 px-4 text-sm font-black"
                          disabled={alert.isUpdating}
                          onClick={() => void handleMarkReviewed(alert.id)}
                        >
                          {alert.isUpdating ? (
                            <>
                              <Loader2 className="mr-1.5 size-4 animate-spin" />
                              {t("parent", "alertsScreen.updating")}
                            </>
                          ) : (
                            t("parent", "alertsScreen.markReviewed")
                          )}
                        </SnowButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <aside className="space-y-4">
            <SnowCard className="bg-snow-lavender p-5">
              <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "alertsScreen.howToRead")}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                {t("parent", "alertsScreen.howToReadDesc")}
              </p>
            </SnowCard>
            <SnowCard className="p-5">
              <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "alertsScreen.reviewPosture")}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
                {t("parent", "alertsScreen.reviewPostureDesc")}
              </p>
            </SnowCard>
          </aside>
        </div>
      )}
    </ParentPageFrame>
  );
}
