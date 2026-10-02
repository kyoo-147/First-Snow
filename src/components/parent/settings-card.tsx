import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function SettingsCard({
  icon: Icon,
  title,
  description,
  value,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <SnowCard className="p-5">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-[var(--radius-md)] bg-snow-primary-soft">
          <Icon className="size-6 text-snow-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-snow-primary-dark">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-snow-muted">{description}</p>
        </div>
        <span className="hidden rounded-full bg-snow-surface-soft px-3 py-2 text-xs font-black text-snow-primary-dark sm:inline-flex">{value}</span>
        <ChevronRight className="size-5 text-snow-muted" />
      </div>
    </SnowCard>
  );
}
