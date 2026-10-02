import { HeartPulse, Leaf, TimerReset } from "lucide-react";
import type { ParentInsight } from "@/types/snow";
import { SnowCard } from "@/components/ui/snow-card";

const tone = {
  success: { icon: Leaf, bg: "bg-snow-ice" },
  calm: { icon: HeartPulse, bg: "bg-snow-primary-soft" },
  warm: { icon: TimerReset, bg: "bg-snow-peach" },
};

export function ParentInsightCard({ insight }: { insight: ParentInsight }) {
  const Icon = tone[insight.tone].icon;
  return (
    <SnowCard className="p-5">
      <div className="flex items-start gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] ${tone[insight.tone].bg}`}>
          <Icon className="size-6 text-snow-primary-dark" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-snow-primary">{insight.metric}</p>
          <h3 className="mt-1 text-lg font-black text-snow-primary-dark">{insight.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">{insight.description}</p>
        </div>
      </div>
    </SnowCard>
  );
}
