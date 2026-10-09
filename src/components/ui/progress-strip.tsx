import { t } from "@/i18n";

export function ProgressStrip({ value, ariaLabel }: { value: number; ariaLabel?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? t("common", "progress")}
      className="h-2 overflow-hidden rounded-full bg-snow-primary-soft"
    >
      <div className="h-full rounded-full bg-snow-primary" style={{ width: `${value}%` }} />
    </div>
  );
}
