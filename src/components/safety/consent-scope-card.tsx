"use client";

import type { LucideIcon } from "lucide-react";
import { Camera, CheckCircle2, Eye, Loader2, Mic, Monitor, ShieldAlert, XCircle } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import type { ConsentRecord, ConsentScope } from "@/lib/safety-client";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { formatSnowDateTime } from "@/lib/format";

const SCOPE_ICONS: Record<ConsentScope, LucideIcon> = {
  microphone: Mic,
  camera: Camera,
  vision: Eye,
  screen: Monitor,
};

export interface ConsentScopeCardProps {
  scope: ConsentScope;
  record?: ConsentRecord;
  isMutating?: boolean;
  onToggleConsent: (scope: ConsentScope, nextGranted: boolean) => void;
}

export function ConsentScopeCard({
  scope,
  record,
  isMutating = false,
  onToggleConsent,
}: ConsentScopeCardProps) {
  const Icon = SCOPE_ICONS[scope];
  const isGranted = record?.status === "granted" || (record?.granted ?? false);
  const status = record?.status ?? (isGranted ? "granted" : "revoked");
  const policyVersion = record?.policyVersion ?? "v1.2";

  const title = t("parent", `safety.consentScopeCard.scopes.${scope}.title` as any);
  const description = t("parent", `safety.consentScopeCard.scopes.${scope}.description` as any);
  const governanceNote = t("parent", `safety.consentScopeCard.scopes.${scope}.governanceNote` as any);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[var(--radius-md)] border p-4.5 transition-all sm:flex-row sm:items-center sm:gap-5",
        isGranted
          ? "border-snow-border bg-white shadow-xs"
          : "border-snow-border/70 bg-snow-surface-soft/60",
      )}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full transition-colors",
            isGranted
              ? "bg-snow-primary-soft text-snow-primary"
              : "bg-snow-surface text-snow-muted border border-snow-border",
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-snow-primary-dark">{title}</h3>
            {status === "granted" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-snow-success/15 px-2.5 py-0.5 text-[11px] font-black text-snow-success">
                <CheckCircle2 className="size-3" />
                {t("parent", "safety.consentScopeCard.activeConsent")}
              </span>
            ) : status === "pending" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-snow-warning/20 px-2.5 py-0.5 text-[11px] font-black text-snow-warning">
                <ShieldAlert className="size-3" />
                {t("parent", "safety.consentScopeCard.pendingReview")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-snow-surface px-2.5 py-0.5 text-[11px] font-black text-snow-muted border border-snow-border">
                <XCircle className="size-3" />
                {t("parent", "safety.consentScopeCard.revokedOff")}
              </span>
            )}
            <span className="text-[10px] font-mono text-snow-muted/80">
              {t("parent", "safety.consentScopeCard.policyVersion", { version: policyVersion })}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">
            {description}
          </p>

          <p className="mt-1.5 text-[11px] font-medium text-snow-primary-dark/75">
            <strong>{t("parent", "safety.consentScopeCard.governanceRule")}</strong> {governanceNote}
          </p>

          {record?.grantedAt ? (
            <p className="mt-1 text-[10px] text-snow-muted font-mono">
              {t("parent", "safety.consentScopeCard.authorizedAt", { date: formatSnowDateTime(record.grantedAt) })}
            </p>
          ) : record?.revokedAt ? (
            <p className="mt-1 text-[10px] text-snow-muted font-mono">
              {t("parent", "safety.consentScopeCard.revokedAt", { date: formatSnowDateTime(record.revokedAt) })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-end gap-3 sm:mt-0">
        <SnowButton
          type="button"
          disabled={isMutating}
          variant={isGranted ? "ghost" : "primary"}
          onClick={() => onToggleConsent(scope, !isGranted)}
          className={cn(
            "min-h-9 px-4 text-xs font-bold",
            isGranted && "text-snow-danger hover:bg-snow-blush/60 hover:text-snow-danger",
          )}
        >
          {isMutating ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              {t("parent", "safety.consentScopeCard.updating")}
            </>
          ) : isGranted ? (
            t("parent", "safety.consentScopeCard.revokeConsent")
          ) : (
            t("parent", "safety.consentScopeCard.grantConsent")
          )}
        </SnowButton>
      </div>
    </div>
  );
}
