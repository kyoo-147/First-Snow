"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import {
  type DeletionProgressState,
  type DeletionRequestRecord,
  type DeletionScope,
  getDeletionRequests,
  requestDataDeletion,
  SafetyApiError,
} from "@/lib/safety-client";
import { cn } from "@/lib/utils";

export interface DeletionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  childId?: string;
  childName?: string;
}

function DeletionRequestDialogInner({
  onClose,
  childId,
  childName = "your child",
}: Omit<DeletionRequestDialogProps, "isOpen">) {
  const [deletionsList, setDeletionsList] = useState<DeletionRequestRecord[]>([]);
  const [isLoadingDeletions, setIsLoadingDeletions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form states
  const [scope, setScope] = useState<DeletionScope>("child_transcripts");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function init() {
      try {
        const records = await getDeletionRequests();
        if (!isCancelled) setDeletionsList(records);
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof SafetyApiError) {
            setErrorMessage(`Unable to fetch deletion history: ${err.message}`);
          } else {
            setErrorMessage("Unable to fetch deletion history.");
          }
        }
      } finally {
        if (!isCancelled) setIsLoadingDeletions(false);
      }
    }
    init();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function loadDeletions() {
    setIsLoadingDeletions(true);
    try {
      const records = await getDeletionRequests();
      setDeletionsList(records);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(`Unable to fetch deletion history: ${err.message}`);
      } else {
        setErrorMessage("Unable to fetch deletion history.");
      }
    } finally {
      setIsLoadingDeletions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setErrorMessage("Please confirm that you understand this deletion is permanent and cannot be undone.");
      return;
    }
    if (!reauthPassword.trim()) {
      setErrorMessage("Please enter your guardian account password to authorize deletion.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const result = await requestDataDeletion({
        scope,
        childId: scope === "entire_account" ? undefined : childId,
        reason: reason.trim() || undefined,
        confirmed: true,
        reauthPassword,
      });

      // Truthful reporting: distinguishes request creation from verified completion!
      setSuccessNotice(
        result.message ||
          "Deletion request recorded. The server has queued this purge job and will process it through the verification stages.",
      );
      setReauthPassword("");
      setConfirmed(false);
      await loadDeletions();
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to initiate deletion request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStatusBadge(status: DeletionProgressState) {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-ice px-2.5 py-0.5 text-[11px] font-black text-snow-primary">
            <Clock className="size-3" />
            Queued for Purge
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-lavender px-2.5 py-0.5 text-[11px] font-black text-snow-primary">
            <Loader2 className="size-3 animate-spin" />
            Erasing Records
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-success/15 px-2.5 py-0.5 text-[11px] font-black text-snow-success">
            <CheckCircle2 className="size-3" />
            Permanently Purged
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-snow-danger/15 px-2.5 py-0.5 text-[11px] font-black text-snow-danger">
            <AlertCircle className="size-3" />
            Deletion Stalled
          </span>
        );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deletion-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs snow-enter-soft"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4 border-b border-snow-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-blush text-snow-danger">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2
                id="deletion-dialog-title"
                className="text-base font-black text-snow-primary-dark"
              >
                Request Data Deletion
              </h2>
              <p className="text-xs font-semibold text-snow-muted">
                Permanent and verifiable child record removal
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close deletion dialog"
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

          <div className="rounded-[var(--radius-md)] border border-snow-warning/40 bg-snow-peach/30 p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-snow-warning" />
              <div className="text-xs font-semibold leading-5 text-snow-primary-dark">
                <strong>Irreversible Operation:</strong> Deletion permanently purges recorded
                dialogues, audio transcripts, and personalized companion memories. It cannot be
                undone once executed by the backend.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-black text-snow-primary-dark">Select Deletion Scope</p>
              <div className="mt-2 space-y-2">
                {[
                  {
                    id: "child_transcripts",
                    label: `Clear conversation transcripts only (${childName})`,
                    detail: "Removes conversation texts and audio logs; keeps progress and avatar milestones.",
                  },
                  {
                    id: "emotion_timeline",
                    label: `Clear emotion observation events (${childName})`,
                    detail: "Removes parent observation logs while preserving child's learning history.",
                  },
                  {
                    id: "all_child_data",
                    label: `Purge all data for child profile (${childName})`,
                    detail: "Deletes transcripts, emotion history, lesson completions, and custom settings.",
                  },
                  {
                    id: "entire_account",
                    label: "Purge entire guardian account and all children",
                    detail: "Completely wipes the household account, guardian profile, and all child data.",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 rounded-[var(--radius-md)] border p-3 cursor-pointer transition",
                      scope === item.id
                        ? "border-snow-danger/40 bg-snow-blush/30"
                        : "border-snow-border bg-snow-surface-soft hover:bg-snow-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="deletion-scope"
                      value={item.id}
                      checked={scope === item.id}
                      onChange={() => setScope(item.id as DeletionScope)}
                      className="mt-0.5 size-4 text-snow-danger focus:ring-snow-danger"
                    />
                    <div className="flex-1 text-xs">
                      <p className="font-black text-snow-primary-dark">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-snow-muted">{item.detail}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="deletion-reason"
                className="block text-xs font-black text-snow-primary-dark"
              >
                Optional Reason (Guardian Feedback)
              </label>
              <textarea
                id="deletion-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you are deleting these records..."
                className="snow-focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-snow-border bg-white p-2.5 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-snow-border bg-white p-3 text-xs font-semibold text-snow-primary-dark cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-snow-border text-snow-danger focus:ring-snow-danger"
              />
              <span className="leading-5">
                I understand that this action is permanent and request status will be tracked through deletion endpoints.
              </span>
            </label>

            <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3.5 space-y-2">
              <label
                htmlFor="deletion-reauth-password"
                className="block text-xs font-black text-snow-primary-dark"
              >
                Guardian Re-Authentication Password
              </label>
              <input
                id="deletion-reauth-password"
                type="password"
                autoComplete="current-password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Enter guardian password to authorize deletion"
                className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
              />
            </div>

            <div className="flex justify-end">
              <SnowButton
                type="submit"
                variant="danger"
                disabled={isSubmitting || !confirmed}
                className="min-h-9 px-5 text-xs font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Lock className="mr-1.5 size-3.5" />
                    Confirm &amp; Request Deletion
                  </>
                )}
              </SnowButton>
            </div>
          </form>

          <div className="border-t border-snow-border pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-snow-primary-dark">
                Recent Deletion Requests
              </h3>
              <button
                type="button"
                onClick={loadDeletions}
                disabled={isLoadingDeletions}
                className="snow-focus-ring flex items-center gap-1 text-[11px] font-bold text-snow-primary hover:underline disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3", isLoadingDeletions && "animate-spin")} />
                Refresh Status
              </button>
            </div>

            {isLoadingDeletions && deletionsList.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-xs font-semibold text-snow-muted">
                <Loader2 className="size-4 animate-spin text-snow-primary" />
                Checking deletion requests...
              </div>
            ) : deletionsList.length === 0 ? (
              <p className="mt-2 text-xs text-snow-muted italic">
                No deletion requests recorded. All scheduled purge operations will appear here.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {deletionsList.map((del) => (
                  <div
                    key={del.id}
                    className="rounded-[var(--radius-md)] border border-snow-border bg-white p-3 text-xs space-y-2"
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-snow-primary-dark uppercase">
                          {del.scope.replace("_", " ")}
                        </span>
                        {renderStatusBadge(del.status)}
                      </div>
                      <span className="text-[10px] font-mono text-snow-muted">
                        Requested: {new Date(del.requestedAt).toLocaleString()}
                      </span>
                    </div>

                    {del.stages && del.stages.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-snow-border/60 pt-2 sm:grid-cols-4">
                        {del.stages.map((stage) => (
                          <div
                            key={stage.stage}
                            className="rounded bg-snow-surface-soft p-1.5 text-[10px]"
                          >
                            <p className="font-bold text-snow-primary-dark">{stage.name}</p>
                            <p className="capitalize text-snow-muted">{stage.status}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {del.error ? (
                      <p className="text-[11px] font-semibold text-snow-danger">
                        Error: {del.error}
                      </p>
                    ) : null}
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
            Close
          </SnowButton>
        </div>
      </div>
    </div>
  );
}

export function DeletionRequestDialog(props: DeletionRequestDialogProps) {
  if (!props.isOpen) return null;
  return <DeletionRequestDialogInner {...props} />;
}
