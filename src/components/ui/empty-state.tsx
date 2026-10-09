import { LucideIcon, HelpCircle } from "lucide-react";
import { SnowButton } from "./snow-button";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type EmptyStateProps = {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const displayTitle = title ?? t("common", "emptyState.noData");

  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
    >
      <div className="grid size-16 place-items-center rounded-full bg-snow-surface-soft text-snow-muted mb-4">
        <Icon className="size-8 opacity-50" />
      </div>
      <h3 className="text-lg font-black text-snow-primary-dark">{displayTitle}</h3>
      {description && (
        <p className="mt-2 text-[15px] font-bold text-snow-muted max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <SnowButton variant="soft" onClick={onAction} className="mt-6">
          {actionLabel}
        </SnowButton>
      )}
    </div>
  );
}
