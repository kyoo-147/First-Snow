"use client";

import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type AuthErrorBannerProps = {
  message?: string | null;
  onDismiss?: () => void;
  className?: string;
};

export function AuthErrorBanner({ message, onDismiss, className }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border border-snow-danger/30 bg-snow-danger/10 p-3.5 text-sm text-snow-primary-dark",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-snow-danger" aria-hidden="true" />
      <div className="flex-1 font-semibold leading-relaxed">{message}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("auth", "error.clearError")}
          className="snow-focus-ring -mr-1 -mt-1 grid size-7 place-items-center rounded-[var(--radius-sm)] text-snow-muted transition hover:bg-snow-danger/15 hover:text-snow-primary-dark"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
