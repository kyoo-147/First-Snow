import { AlertTriangle, RotateCcw } from "lucide-react";
import { SnowButton } from "./snow-button";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayTitle = title ?? t("common", "errorState.defaultTitle");
  const displayDescription = description ?? t("common", "errorState.defaultDescription");

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="grid size-16 place-items-center rounded-full bg-snow-peach/20 text-snow-peach mb-4">
        <AlertTriangle className="size-8" />
      </div>
      <h3 className="text-lg font-black text-snow-primary-dark">{displayTitle}</h3>
      <p className="mt-2 text-[15px] font-bold text-snow-muted max-w-sm">
        {displayDescription}
      </p>
      {onRetry && (
        <SnowButton variant="soft" onClick={onRetry} className="mt-6 gap-2">
          <RotateCcw className="size-4" /> {t("common", "errorState.retry")}
        </SnowButton>
      )}
    </div>
  );
}
