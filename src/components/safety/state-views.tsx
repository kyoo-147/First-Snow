"use client";

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export function SafetyLoadingSkeleton({
  label,
  count = 3,
}: {
  label?: string;
  count?: number;
}) {
  const displayLabel = label ?? t("parent", "safety.stateViews.loadingSettings");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-4 py-2"
    >
      <div className="flex items-center gap-3 text-sm font-bold text-snow-muted">
        <Loader2 className="size-5 animate-spin text-snow-primary" />
        <span>{displayLabel}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center justify-between rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4"
          >
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-snow-border/50" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-snow-border/60" />
                <div className="h-3 w-56 rounded bg-snow-border/40" />
              </div>
            </div>
            <div className="h-6 w-14 rounded-full bg-snow-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SafetyErrorBanner({
  title,
  message,
  code,
  requestId,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  code?: string;
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const displayTitle = title ?? t("parent", "safety.stateViews.errorTitle");

  return (
    <div
      role="alert"
      className={cn(
        "rounded-[var(--radius-md)] border border-snow-danger/30 bg-snow-blush/60 p-4 text-snow-primary-dark transition-all",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-snow-danger" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-snow-danger">{displayTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-snow-primary-dark/80">
            {message}
          </p>
          {code || requestId ? (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono text-snow-muted">
              {code ? (
                <span className="rounded bg-white/70 px-2 py-0.5">{t("parent", "safety.stateViews.codeLabel", { code })}</span>
              ) : null}
              {requestId ? (
                <span className="rounded bg-white/70 px-2 py-0.5">{t("parent", "safety.stateViews.requestIdLabel", { requestId })}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {onRetry ? (
          <SnowButton
            variant="ghost"
            onClick={onRetry}
            className="shrink-0 text-xs text-snow-primary-dark"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            {t("parent", "safety.stateViews.retry")}
          </SnowButton>
        ) : null}
      </div>
    </div>
  );
}

export function SafetyEmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-snow-border bg-snow-surface-soft/60 px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-snow-surface text-snow-muted shadow-xs">
        {icon || <AlertTriangle className="size-6 text-snow-muted" />}
      </div>
      <h3 className="text-sm font-black text-snow-primary-dark">{title}</h3>
      <p className="mt-1 max-w-sm text-xs font-semibold text-snow-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
