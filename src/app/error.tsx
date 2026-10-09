"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { t } from "@/i18n";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error summary
    console.error("Root route error:", error?.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="snow-page-bg min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-peach/20 text-snow-peach">
        <AlertTriangle className="size-8" />
      </div>

      <div className="mt-4 max-w-[440px] space-y-2">
        <h2 className="snow-heading font-black text-snow-primary-dark">
          {t("common", "errorState.defaultTitle")}
        </h2>
        <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
          {t("common", "errorState.defaultDescription")}
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <SnowButton onClick={() => reset()} variant="primary" className="min-w-[140px]">
          <RotateCcw className="size-4" /> {t("common", "retry")}
        </SnowButton>
        <Link href="/">
          <SnowButton variant="ghost" className="min-w-[140px]">
            {t("common", "returnHome")}
          </SnowButton>
        </Link>
      </div>
    </div>
  );
}
