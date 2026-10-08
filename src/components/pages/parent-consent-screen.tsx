"use client";
import { t } from "@/i18n";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileCheck,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import {
  CapturePolicyBanner,
  ConsentScopeCard,
  ReauthModal,
  SafetyErrorBanner,
  SafetyLoadingSkeleton,
} from "@/components/safety";
import { SnowButton } from "@/components/ui/snow-button";
import {
  type ConsentRecord,
  type ConsentScope,
  createConsent,
  getConsents,
  SafetyApiError,
} from "@/lib/safety-client";
import { cn } from "@/lib/utils";

const ALL_SCOPES: ConsentScope[] = ["microphone", "camera", "vision", "screen"];

export function ParentConsentScreen() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [mutatingScope, setMutatingScope] = useState<ConsentScope | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reauth modal state
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [pendingConsentAction, setPendingConsentAction] = useState<{
    scope: ConsentScope;
    nextGranted: boolean;
  } | null>(null);
  const [isReauthProcessing, setIsReauthProcessing] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  async function loadConsents() {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(undefined);
    setRequestId(undefined);

    try {
      const data = await getConsents();
      setConsents(data.consents);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "consent.failedLoad"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function executeConsentUpdate(
    scope: ConsentScope,
    nextGranted: boolean,
    reauthPassword?: string,
  ) {
    setMutatingScope(scope);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await createConsent({
        scope,
        granted: nextGranted,
        policyVersion: "2026.1",
        reauthPassword,
      });

      // Update local state with truthful server record
      setConsents((prev) => {
        const filtered = prev.filter((item) => item.scope !== scope);
        return [...filtered, response.consent];
      });

      setSuccessMessage(
        response.message ||
          t("parent", "consent.grantSuccess", { action: nextGranted ? t("parent", "consent.granted") : t("parent", "consent.revoked"), scope }),
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        if (err.isReauthRequired) {
          // Open parent re-auth prompt contract
          setPendingConsentAction({ scope, nextGranted });
          setIsReauthOpen(true);
          return;
        }
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "consent.updateFailed", { scope }));
      }
    } finally {
      setMutatingScope(null);
    }
  }

  function handleToggleConsent(scope: ConsentScope, nextGranted: boolean) {
    executeConsentUpdate(scope, nextGranted);
  }

  async function handleReauthConfirm(password: string) {
    if (!pendingConsentAction) return;
    setIsReauthProcessing(true);
    try {
      await executeConsentUpdate(
        pendingConsentAction.scope,
        pendingConsentAction.nextGranted,
        password,
      );
      setIsReauthOpen(false);
      setPendingConsentAction(null);
    } finally {
      setIsReauthProcessing(false);
    }
  }

  const activeCount = consents.filter((c) => c.status === "granted" || c.granted).length;
  const pendingCount = consents.filter((c) => c.status === "pending").length;

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "consent.eyebrow")}
        title={t("parent", "consent.title")}
        description={t("parent", "consent.description")}
        action={
          <SnowButton
            variant="ghost"
            onClick={loadConsents}
            disabled={isLoading}
            className="text-xs font-bold"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} />
            {t("parent", "consent.syncRecords")}
          </SnowButton>
        }
      />

      {errorMessage ? (
        <SafetyErrorBanner
          message={errorMessage}
          code={errorCode}
          requestId={requestId}
          onRetry={loadConsents}
        />
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-snow-success/30 bg-snow-success/10 px-4 py-2.5 text-xs font-bold text-snow-success snow-enter-soft"
        >
          <CheckCircle2 className="size-4" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          label={t("parent", "consent.activeAuth")}
          value={isLoading ? "..." : `${activeCount} of 4`}
          detail={t("parent", "consent.activeAuthDetail")}
          icon={<FileCheck className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label={t("parent", "consent.pendingReview")}
          value={isLoading ? "..." : `${pendingCount}`}
          detail={pendingCount > 0 ? t("parent", "consent.actionRequired") : t("parent", "consent.allReviewed")}
          icon={<ShieldAlert className="size-5 text-snow-primary" />}
          tone={pendingCount > 0 ? "bg-snow-peach" : "bg-snow-ice"}
        />
        <StatusTile
          label={t("parent", "consent.govPolicy")}
          value={t("parent", "consent.failClosed")}
          detail={t("parent", "consent.failClosedDetail")}
          icon={<Lock className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
      </div>

      <CapturePolicyBanner />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection
          title={t("parent", "consent.hwPermissions")}
          description={t("parent", "consent.hwPermissionsDesc")}
        >
          {isLoading ? (
            <SafetyLoadingSkeleton label={t("parent", "consent.verifying")} count={4} />
          ) : (
            <div className="space-y-3">
              {ALL_SCOPES.map((scope) => {
                const record = consents.find((c) => c.scope === scope);
                const isMutatingThis = mutatingScope === scope;

                return (
                  <ConsentScopeCard
                    key={scope}
                    scope={scope}
                    record={record}
                    isMutating={isMutatingThis}
                    onToggleConsent={handleToggleConsent}
                  />
                );
              })}
            </div>
          )}
        </SettingsSection>

        <aside className="space-y-4">
          <SettingsSection title={t("parent", "consent.policyHeader")}>
            {[
              t("parent", "consent.policy1"),
              t("parent", "consent.policy2"),
              t("parent", "consent.policy3"),
              t("parent", "consent.policy4"),
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-snow-surface-soft p-3 text-xs font-semibold leading-5 text-snow-primary-dark"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-snow-success" />
                <span>{item}</span>
              </div>
            ))}
          </SettingsSection>

          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-snow-primary" />
              <h2 className="text-sm font-black text-snow-primary-dark">{t("parent", "consent.failClosed")}</h2>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-snow-primary-dark">
              Sensitive capture remains unavailable until backend consent/grant enforcement is verified.
              Client controls do not activate browser media APIs directly in this lane.
            </p>
          </div>
        </aside>
      </div>

      <ReauthModal
        isOpen={isReauthOpen}
        title={t("parent", "consent.reauthRequired")}
        description={t("parent", "consent.reauthDesc")}
        isProcessing={isReauthProcessing}
        onConfirm={handleReauthConfirm}
        onClose={() => {
          setIsReauthOpen(false);
          setPendingConsentAction(null);
        }}
      />
    </ParentPageFrame>
  );
}
