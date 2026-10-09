"use client";

import { t } from "@/i18n";

import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  Heart,
  Loader2,
  Mic,
  Monitor,
  RefreshCw,
  Shield,
  Trash2,
  VideoOff,
} from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import {
  CapturePolicyBanner,
  DataExportDialog,
  DeletionRequestDialog,
  SafetyErrorBanner,
  SafetyLoadingSkeleton,
} from "@/components/safety";
import { SnowButton } from "@/components/ui/snow-button";
import {
  getConsents,
  getPrivacySettings,
  type PrivacySettingsData,
  SafetyApiError,
  updatePrivacySettings,
} from "@/lib/safety-client";
import { cn } from "@/lib/utils";

interface PrivacyItemConfig {
  key: keyof PrivacySettingsData;
  titleKey: "microphoneAccess" | "cameraAccess" | "cameraPreviewSetting" | "visionAiAccess" | "screenCaptureAccess" | "transcriptStorageDays" | "emotionTimelineStorage";
  detailKey: "microphoneAccessDesc" | "cameraAccessDesc" | "cameraPreviewSettingDesc" | "visionAiAccessDesc" | "screenCaptureAccessDesc" | "transcriptStorageDaysDesc" | "emotionTimelineStorageDesc";
  icon: LucideIcon;
  kind: "toggle" | "select";
  options?: number[];
}

const PRIVACY_ITEMS: PrivacyItemConfig[] = [
  {
    key: "microphoneAccess",
    titleKey: "microphoneAccess",
    detailKey: "microphoneAccessDesc",
    icon: Mic,
    kind: "toggle",
  },
  {
    key: "cameraAccess",
    titleKey: "cameraAccess",
    detailKey: "cameraAccessDesc",
    icon: Camera,
    kind: "toggle",
  },
  {
    key: "cameraPreview",
    titleKey: "cameraPreviewSetting",
    detailKey: "cameraPreviewSettingDesc",
    icon: VideoOff,
    kind: "toggle",
  },
  {
    key: "visionAiAccess",
    titleKey: "visionAiAccess",
    detailKey: "visionAiAccessDesc",
    icon: Eye,
    kind: "toggle",
  },
  {
    key: "screenCaptureAccess",
    titleKey: "screenCaptureAccess",
    detailKey: "screenCaptureAccessDesc",
    icon: Monitor,
    kind: "toggle",
  },
  {
    key: "transcriptStorageDays",
    titleKey: "transcriptStorageDays",
    detailKey: "transcriptStorageDaysDesc",
    icon: FileCheck,
    kind: "select",
    options: [7, 14, 30, 60, 90],
  },
  {
    key: "emotionTimelineStorage",
    titleKey: "emotionTimelineStorage",
    detailKey: "emotionTimelineStorageDesc",
    icon: Heart,
    kind: "toggle",
  },
];

export function ParentPrivacyScreen() {
  const [settings, setSettings] = useState<PrivacySettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Consent summary
  const [consentActiveCount, setConsentActiveCount] = useState<number>(0);

  // Dialog states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeletionOpen, setIsDeletionOpen] = useState(false);

  useEffect(() => {
    loadPrivacy();
  }, []);

  async function loadPrivacy() {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(undefined);
    setRequestId(undefined);

    try {
      const [privacyData, consentsData] = await Promise.all([
        getPrivacySettings(),
        getConsents().catch(() => ({ consents: [] })),
      ]);

      setSettings(privacyData);

      const activeConsents = consentsData.consents.filter(
        (c) => c.status === "granted" || c.granted,
      );
      setConsentActiveCount(activeConsents.length);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "privacy.fetchError"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(key: keyof PrivacySettingsData) {
    if (!settings || mutatingKey) return;

    const previousValue = settings[key];
    const nextValue = !previousValue;
    const optimistic = { ...settings, [key]: nextValue };

    setSettings(optimistic);
    setMutatingKey(String(key));
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const updated = await updatePrivacySettings({ [key]: nextValue });
      // Update with server response (no fake success)
      setSettings(updated);
      setSaveSuccessMessage(t("parent", "privacy.updateSuccess", { key: String(key) }));
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: unknown) {
      // Rollback optimistic update on error
      setSettings(settings);
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "privacy.updateFailed", { key: String(key) }));
      }
    } finally {
      setMutatingKey(null);
    }
  }

  async function handleSelectChange(key: keyof PrivacySettingsData, value: number) {
    if (!settings || mutatingKey) return;

    const previousValue = settings[key];
    const optimistic = { ...settings, [key]: value };

    setSettings(optimistic);
    setMutatingKey(String(key));
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const updated = await updatePrivacySettings({ [key]: value });
      setSettings(updated);
      setSaveSuccessMessage(t("parent", "privacy.retentionSuccess", { days: value }));
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setSettings((prev) => (prev ? { ...prev, [key]: previousValue } : prev));
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "privacy.retentionFailed"));
      }
    } finally {
      setMutatingKey(null);
    }
  }

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "privacy.eyebrow")}
        title={t("parent", "privacy.title")}
        description={t("parent", "privacy.notice")}
        action={
          <SnowButton
            variant="ghost"
            onClick={loadPrivacy}
            disabled={isLoading}
            className="text-xs font-bold"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} />
            {t("parent", "privacy.syncStatus")}
          </SnowButton>
        }
      />

      {errorMessage ? (
        <SafetyErrorBanner
          message={errorMessage}
          code={errorCode}
          requestId={requestId}
          onRetry={loadPrivacy}
        />
      ) : null}

      {saveSuccessMessage ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-snow-success/30 bg-snow-success/10 px-4 py-2.5 text-xs font-bold text-snow-success snow-enter-soft"
        >
          <CheckCircle2 className="size-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          label={t("parent", "privacy.cameraPreview")}
          value={settings?.cameraPreview ? t("parent", "privacy.active") : t("parent", "privacy.off")}
          detail={settings?.cameraPreview ? t("parent", "privacy.previewVisible") : t("parent", "privacy.hiddenDefault")}
          icon={<VideoOff className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label={t("parent", "privacy.visionAi")}
          value={settings?.visionAiAccess ? t("parent", "privacy.allowed") : t("parent", "privacy.off")}
          detail={t("parent", "privacy.parentGating")}
          icon={<Eye className="size-5 text-snow-primary" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label={t("parent", "privacy.activeConsents")}
          value={isLoading ? "..." : t("parent", "privacy.activeConsentsCount", { count: consentActiveCount })}
          detail={t("parent", "privacy.activeConsentsDetail")}
          icon={<FileCheck className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
      </div>

      <CapturePolicyBanner />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection
          title={t("parent", "privacy.hardwareAndStorage")}
          description={t("parent", "privacy.hardwareDesc")}
        >
          {isLoading ? (
            <SafetyLoadingSkeleton label={t("parent", "privacy.fetching")} count={5} />
          ) : settings ? (
            PRIVACY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isMutatingThis = mutatingKey === item.key;
              const value = settings[item.key];
              const title = t("parent", `privacy.${item.titleKey}`);
              const detail = t("parent", `privacy.${item.detailKey}`);

              return (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary border border-snow-border">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-snow-primary-dark">{title}</p>
                      <p className="mt-0.5 text-xs font-semibold leading-5 text-snow-muted">
                        {detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-3 self-end sm:self-center">
                    {item.kind === "toggle" ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(value)}
                        aria-label={t("parent", "privacy.toggleAria", { name: title })}
                        disabled={isMutatingThis}
                        onClick={() => handleToggle(item.key)}
                        className={cn(
                          "snow-focus-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50",
                          value ? "bg-snow-success" : "bg-snow-border",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                            value ? "translate-x-5" : "translate-x-0.5",
                          )}
                        />
                      </button>
                    ) : item.kind === "select" && item.options ? (
                      <select
                        aria-label={t("parent", "privacy.selectAria", { name: title })}
                        disabled={isMutatingThis}
                        value={Number(value) || 30}
                        onChange={(e) => handleSelectChange(item.key, Number(e.target.value))}
                        className="snow-focus-ring rounded-[var(--radius-md)] border border-snow-border bg-white px-2.5 py-1 text-xs font-bold text-snow-primary-dark"
                      >
                        {item.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {t("parent", "privacy.daysUnit", { count: opt })}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {isMutatingThis ? (
                      <Loader2 className="size-4 animate-spin text-snow-primary" />
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-xs text-snow-muted">
              {t("parent", "privacy.fetchFailed")}
            </p>
          )}
        </SettingsSection>

        <aside className="space-y-4">
          <SettingsSection
            title={t("parent", "privacy.dataOwnership")}
            description={t("parent", "privacy.dataRightsDesc")}
          >
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="snow-focus-ring snow-interactive-card flex w-full items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-left text-sm font-black text-snow-primary-dark"
            >
              <span className="flex items-center gap-3">
                <Download className="size-4 text-snow-primary" />
                {t("parent", "privacy.exportData")}
              </span>
              <span className="rounded-full bg-snow-ice px-2 py-0.5 text-[10px] font-bold text-snow-primary">
                {t("parent", "privacy.zipJson")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeletionOpen(true)}
              className="snow-focus-ring snow-interactive-card flex w-full items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-left text-sm font-black text-snow-danger"
            >
              <span className="flex items-center gap-3">
                <Trash2 className="size-4 text-snow-danger" />
                {t("parent", "privacy.requestDeletion")}
              </span>
              <span className="rounded-full bg-snow-blush px-2 py-0.5 text-[10px] font-bold text-snow-danger">
                {t("parent", "privacy.permanentPurge")}
              </span>
            </button>
          </SettingsSection>

          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-snow-primary" />
              <h2 className="text-sm font-black text-snow-primary-dark">{t("parent", "privacy.calmCopyRule")}</h2>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-snow-primary-dark">
              {t("parent", "privacy.calmCopyDesc")}
            </p>
          </div>
        </aside>
      </div>

      <DataExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        childName={t("parent", "safety.export.household")}
      />

      <DeletionRequestDialog
        isOpen={isDeletionOpen}
        onClose={() => setIsDeletionOpen(false)}
        childName={t("parent", "safety.export.household")}
      />
    </ParentPageFrame>
  );
}
