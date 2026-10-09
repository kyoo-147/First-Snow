"use client";
import { t } from "@/i18n";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";

export interface ReauthModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  actionLabel?: string;
  isProcessing?: boolean;
  errorMessage?: string | null;
  onConfirm: (password: string) => Promise<void> | void;
  onClose: () => void;
}

function ReauthModalInner({
  title = "Guardian Re-Authentication Required",
  description = "To protect child privacy and safety configurations, please enter your guardian account password to authorize this action.",
  actionLabel = "Confirm Authorization",
  isProcessing = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: Omit<ReauthModalProps, "isOpen">) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isProcessing) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError("Please enter your guardian password.");
      passwordInputRef.current?.focus();
      return;
    }
    setLocalError(null);
    try {
      await onConfirm(password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Re-authentication failed. Please check your password and try again.");
      }
    }
  }

  const effectiveError = errorMessage || localError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-dialog-title"
      aria-describedby="reauth-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs snow-enter-soft"
    >
      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 id="reauth-dialog-title" className="text-base font-black text-snow-primary-dark">
                {title}
              </h2>
              <p className="text-xs font-semibold text-snow-muted">{t("parent", "safety.reauth.parentGate")}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("parent", "safety.reauth.closeAria")}
            disabled={isProcessing}
            onClick={onClose}
            className="snow-focus-ring grid size-8 place-items-center rounded-full text-snow-muted hover:bg-snow-surface-soft hover:text-snow-primary-dark disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <p id="reauth-dialog-desc" className="mt-3 text-xs font-semibold leading-5 text-snow-muted">
          {description}
        </p>

        {effectiveError ? (
          <div
            role="alert"
            className="mt-3 rounded-[var(--radius-md)] border border-snow-danger/30 bg-snow-blush/60 p-3 text-xs font-bold text-snow-danger"
          >
            {effectiveError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="reauth-password-input"
              className="block text-xs font-black text-snow-primary-dark"
            >
              Guardian Password
            </label>
            <div className="relative mt-1">
              <input
                id="reauth-password-input"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isProcessing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("parent", "safety.reauth.passwordPlaceholder")}
                className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-snow-primary-dark placeholder:text-snow-muted/70 focus:border-snow-primary disabled:opacity-60"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
                disabled={isProcessing}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-snow-muted hover:text-snow-primary-dark disabled:opacity-40"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-snow-primary-dark">
              <ShieldCheck className="size-4 text-snow-success" />
              <span>{t("parent", "safety.reauth.zeroCompromise")}</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-snow-muted">
              Credentials are authenticated directly with the backend and never stored in the browser.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <SnowButton
              type="button"
              variant="ghost"
              disabled={isProcessing}
              onClick={onClose}
              className="min-h-9 px-4 text-xs font-bold"
            >
              Cancel
            </SnowButton>
            <SnowButton
              type="submit"
              variant="primary"
              disabled={isProcessing}
              className="min-h-9 px-5 text-xs font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 size-3.5" />
                  {actionLabel}
                </>
              )}
            </SnowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReauthModal(props: ReauthModalProps) {
  if (!props.isOpen) return null;
  return <ReauthModalInner {...props} />;
}
