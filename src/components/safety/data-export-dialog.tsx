"use client";
import { t } from "@/i18n";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  X,
} from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import {
  type DataExportProgressState,
  type DataExportRecord,
  getDataExports,
  requestDataExport,
  SafetyApiError,
} from "@/lib/safety-client";
import { formatSnowDate, formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DataExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  childId?: string;
  childName?: string;
}

function DataExportDialogInner({
  onClose,
  childId,
  childName = t("parent", "safety.export.defaultChildName"),
}: Omit<DataExportDialogProps, "isOpen">) {
  const [exportsList, setExportsList] = useState<DataExportRecord[]>([]);
  const [isLoadingExports, setIsLoadingExports] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form states
  const [includeTranscripts, setIncludeTranscripts] = useState(true);
  const [includeEmotionTimeline, setIncludeEmotionTimeline] = useState(true);
  const [includeLearningProgress, setIncludeLearningProgress] = useState(true);
  const [format, setFormat] = useState<"zip" | "json" | "csv">("zip");
  const [reauthPassword, setReauthPassword] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function init() {
      try {
        const records = await getDataExports();
        if (!isCancelled) setExportsList(records);
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof SafetyApiError) {
            setErrorMessage(t("parent", "safety.export.errorFetchDetail", { message: err.message }));
          } else {
            setErrorMessage(t("parent", "safety.export.errorFetch"));
          }
        }
      } finally {
        if (!isCancelled) setIsLoadingExports(false);
      }
    }
    init();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function loadExports() {
    setIsLoadingExports(true);
    try {
      const records = await getDataExports();
      setExportsList(records);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(t("parent", "safety.export.errorFetchDetail", { message: err.message }));
      } else {
        setErrorMessage(t("parent", "safety.export.errorFetch"));
      }
    } finally {
      setIsLoadingExports(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reauthPassword.trim()) {
      setErrorMessage(t("parent", "safety.export.errorPassword"));
      return;
    }
    if (!includeTranscripts && !includeEmotionTimeline && !includeLearningProgress) {
      setErrorMessage(t("parent", "safety.export.errorCategory"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const result = await requestDataExport({
        childId,
        includeTranscripts,
        includeEmotionTimeline,
        includeLearningProgress,
        format,
        reauthPassword,
      });

      // Truthful workflow: distinguishes request creation from verified completion!
      setSuccessNotice(
        result.message ||
          t("parent", "safety.export.successSubmit"),
      );
      setReauthPassword("");
      await loadExports();
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t("parent", "safety.export.errorSubmit"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStatusBadge(status: DataExportProgressState) {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-ice px-2.5 py-0.5 text-[11px] font-black text-snow-primary">
            <Clock className="size-3" />
            {t("parent", "safety.export.status.requested")}
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-lavender px-2.5 py-0.5 text-[11px] font-black text-snow-primary">
            <Loader2 className="size-3 animate-spin" />
            {t("parent", "safety.export.status.running")}
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-success/15 px-2.5 py-0.5 text-[11px] font-black text-snow-success">
            <CheckCircle2 className="size-3" />
            {t("parent", "safety.export.status.completed")}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-danger/15 px-2.5 py-0.5 text-[11px] font-black text-snow-danger">
            <AlertCircle className="size-3" />
            {t("parent", "safety.export.status.failed")}
          </span>
        );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-export-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs snow-enter-soft"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4 border-b border-snow-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
              <Archive className="size-5" />
            </div>
            <div>
              <h2 id="data-export-title" className="text-base font-black text-snow-primary-dark">
                {t("parent", "safety.export.dialogTitle")}
              </h2>
              <p className="text-xs font-semibold text-snow-muted">
                {t("parent", "safety.export.target", { name: childName })}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("parent", "safety.export.closeAria")}
            onClick={onClose}
            className="snow-focus-ring grid size-8 place-items-center rounded-full text-snow-muted hover:bg-snow-surface-soft hover:text-snow-primary-dark"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="snow-scrollbar min-h-0 flex-1 overflow-y-auto py-4 space-y-5">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-[var(--radius-md)] border border-snow-danger/30 bg-snow-blush/60 p-3 text-xs font-bold text-snow-danger"
            >
              {errorMessage}
            </div>
          ) : null}

          {successNotice ? (
            <div
              role="status"
              className="rounded-[var(--radius-md)] border border-snow-success/30 bg-snow-success/10 p-3 text-xs font-bold text-snow-success"
            >
              {successNotice}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-black text-snow-primary-dark">{t("parent", "safety.export.recordsLabel")}</p>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3 text-xs font-semibold text-snow-primary-dark cursor-pointer hover:bg-snow-lavender/30">
                  <input
                    type="checkbox"
                    checked={includeTranscripts}
                    onChange={(e) => setIncludeTranscripts(e.target.checked)}
                    className="size-4 rounded border-snow-border text-snow-primary"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{t("parent", "safety.export.recordsTranscripts")}</p>
                    <p className="text-[11px] text-snow-muted">
                      {t("parent", "safety.export.recordsTranscriptsDesc")}
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3 text-xs font-semibold text-snow-primary-dark cursor-pointer hover:bg-snow-lavender/30">
                  <input
                    type="checkbox"
                    checked={includeEmotionTimeline}
                    onChange={(e) => setIncludeEmotionTimeline(e.target.checked)}
                    className="size-4 rounded border-snow-border text-snow-primary"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{t("parent", "safety.export.recordsEmotions")}</p>
                    <p className="text-[11px] text-snow-muted">
                      {t("parent", "safety.export.recordsEmotionsDesc")}
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3 text-xs font-semibold text-snow-primary-dark cursor-pointer hover:bg-snow-lavender/30">
                  <input
                    type="checkbox"
                    checked={includeLearningProgress}
                    onChange={(e) => setIncludeLearningProgress(e.target.checked)}
                    className="size-4 rounded border-snow-border text-snow-primary"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{t("parent", "safety.export.recordsLearning")}</p>
                    <p className="text-[11px] text-snow-muted">
                      {t("parent", "safety.export.recordsLearningDesc")}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-snow-primary-dark">{t("parent", "safety.export.formatLabel")}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: "zip", label: t("parent", "safety.export.formatZip"), icon: Archive, desc: t("parent", "safety.export.formatZipDesc") },
                  { id: "json", label: t("parent", "safety.export.formatJson"), icon: FileText, desc: t("parent", "safety.export.formatJsonDesc") },
                  { id: "csv", label: t("parent", "safety.export.formatCsv"), icon: FileSpreadsheet, desc: t("parent", "safety.export.formatCsvDesc") },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id as "zip" | "json" | "csv")}
                    className={cn(
                      "snow-focus-ring flex flex-col items-center rounded-[var(--radius-md)] border p-3 text-center transition",
                      format === item.id
                        ? "border-snow-primary bg-snow-primary-soft text-snow-primary font-black"
                        : "border-snow-border bg-snow-surface-soft text-snow-muted hover:border-snow-border-strong",
                    )}
                  >
                    <item.icon className="size-5 mb-1 text-snow-primary" />
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[10px] text-snow-muted">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3.5 space-y-2">
              <label
                htmlFor="export-reauth-password"
                className="block text-xs font-black text-snow-primary-dark"
              >
                {t("parent", "safety.export.passwordLabel")}
              </label>
              <input
                id="export-reauth-password"
                type="password"
                autoComplete="current-password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder={t("parent", "safety.export.passwordPlaceholder")}
                className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
              />
              <p className="text-[11px] text-snow-muted">
                {t("parent", "safety.export.passwordHelp")}
              </p>
            </div>

            <div className="flex justify-end">
              <SnowButton
                type="submit"
                disabled={isSubmitting}
                className="min-h-9 px-5 text-xs font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    {t("parent", "safety.export.submitting")}
                  </>
                ) : (
                  <>
                    <Lock className="mr-1.5 size-3.5" />
                    {t("parent", "safety.export.submit")}
                  </>
                )}
              </SnowButton>
            </div>
          </form>

          <div className="border-t border-snow-border pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-snow-primary-dark">{t("parent", "safety.export.historyTitle")}</h3>
              <button
                type="button"
                onClick={loadExports}
                disabled={isLoadingExports}
                className="snow-focus-ring flex items-center gap-1 text-[11px] font-bold text-snow-primary hover:underline disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3", isLoadingExports && "animate-spin")} />
                {t("parent", "safety.export.refresh")}
              </button>
            </div>

            {isLoadingExports && exportsList.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-xs font-semibold text-snow-muted">
                <Loader2 className="size-4 animate-spin text-snow-primary" />
                {t("parent", "safety.export.checking")}
              </div>
            ) : exportsList.length === 0 ? (
              <p className="mt-2 text-xs text-snow-muted italic">
                {t("parent", "safety.export.empty")}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {exportsList.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex flex-col justify-between gap-2 rounded-[var(--radius-md)] border border-snow-border bg-white p-3 text-xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-snow-primary-dark">
                          {t("parent", "safety.export.archiveLabel", { format: exp.format.toUpperCase() })}
                        </span>
                        {renderStatusBadge(exp.status)}
                      </div>
                      <p className="mt-0.5 text-[11px] text-snow-muted">
                        {t("parent", "safety.export.requestedAt", { date: formatSnowDateTime(exp.requestedAt) })}
                        {exp.expiresAt
                          ? ` • ${t("parent", "safety.export.expiresAt", { date: formatSnowDate(exp.expiresAt) })}`
                          : ""}
                      </p>
                      {exp.error ? (
                        <p className="mt-1 text-[11px] font-semibold text-snow-danger">
                          {t("parent", "safety.export.errorLabel", { message: exp.error })}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {exp.status === "completed" && exp.downloadUrl ? (
                        <a
                          href={exp.downloadUrl}
                          download
                          className="snow-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-snow-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105"
                        >
                          <Download className="size-3.5" />
                          {t("parent", "safety.export.download")}
                        </a>
                      ) : exp.status === "running" ? (
                        <span className="text-[11px] font-semibold text-snow-muted">
                          {t("parent", "safety.export.processing")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-snow-border pt-3 text-right">
          <SnowButton
            variant="ghost"
            onClick={onClose}
            className="min-h-8 px-4 text-xs font-bold text-snow-muted hover:text-snow-primary-dark"
          >
            {t("parent", "safety.export.close")}
          </SnowButton>
        </div>
      </div>
    </div>
  );
}

export function DataExportDialog(props: DataExportDialogProps) {
  if (!props.isOpen) return null;
  return <DataExportDialogInner {...props} />;
}
