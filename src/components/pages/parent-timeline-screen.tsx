"use client";

import { useState } from "react";
import { Activity, Calendar, Clock, Download, TrendingUp } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById, getEmotionEventsByChildId } from "@/data";
import { parentInsights } from "@/data/snow-data";
import { formatSnowDate, formatSnowDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ParentTimelineScreen({ childId = "minh" }: { childId?: string }) {
  const child = getChildById(childId);
  const emotions = getEmotionEventsByChildId(childId);
  const [activeEmotionId, setActiveEmotionId] = useState(emotions[0]?.id ?? "");
  const [activeFilter, setActiveFilter] = useState<"all" | "settled" | "needs-time">("all");
  const activeEmotion = emotions.find((emotion) => emotion.id === activeEmotionId) ?? emotions[0];
  const filteredEmotions = emotions.filter((emotion) => {
    if (activeFilter === "settled") return emotion.emotion === "calm" || emotion.emotion === "happy";
    if (activeFilter === "needs-time") return emotion.emotion === "frustrated";
    return true;
  });
  const groupedEmotions = filteredEmotions.reduce<Record<string, typeof emotions>>((groups, emotion) => {
    const day = formatSnowDate(emotion.timestamp);
    groups[day] = groups[day] ? [...groups[day], emotion] : [emotion];
    return groups;
  }, {});
  const chartPoints = [
    { day: "Mon", learning: 46, comfort: 24 },
    { day: "Tue", learning: 58, comfort: 29 },
    { day: "Wed", learning: 64, comfort: 34 },
    { day: "Thu", learning: 59, comfort: 30 },
    { day: "Fri", learning: 76, comfort: 40 },
  ];

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={`${child.name}'s timeline`}
        title="Emotion timeline"
        description={`A simple observation history showing how ${child.name} moved through recent AgentKid sessions.`}
        action={
          <div className="flex flex-wrap gap-3">
            <SnowButton variant="soft"><Calendar className="mr-2 size-4" /> Last 7 days</SnowButton>
            <SnowButton variant="soft"><Download className="mr-2 size-4" /> Export</SnowButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {parentInsights.map((insight) => (
          <StatusTile key={insight.title} label={insight.title} value={insight.metric} detail={insight.description} icon={<TrendingUp className="size-5 text-snow-primary" />} />
        ))}
      </div>

      <SnowCard className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-snow-primary-dark">Learning and comfort trend</h2>
            <p className="mt-1 text-sm font-semibold text-snow-muted">A parent-safe view of how steadiness changed across the week.</p>
          </div>
          <span className="rounded-full bg-snow-ice px-3 py-1.5 text-xs font-black text-snow-primary-dark">This week</span>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface-soft p-4">
            <div className="relative h-44 w-full">
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 180">
                <path d="M 40,126 L 260,102 L 480,84 L 700,94 L 920,56" fill="none" stroke="var(--snow-chart-purple)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 40,144 L 260,130 L 480,112 L 700,122 L 920,88" fill="none" stroke="var(--snow-chart-teal)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {chartPoints.map((point, index) => {
                  const x = 40 + index * 220;
                  const purpleY = 172 - point.learning * 1.53;
                  const tealY = 172 - point.comfort * 2.1;
                  return (
                    <g key={point.day}>
                      <circle cx={x} cy={purpleY} r="5.5" fill="var(--snow-chart-purple)" />
                      <circle cx={x} cy={tealY} r="5.5" fill="var(--snow-chart-teal)" />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs font-black text-snow-muted">
                {chartPoints.map((point) => (
                  <span key={point.day}>{point.day}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["Learning", "More confidence after familiar story openings."],
              ["Comfort", "Transitions improved after one short breathing pause."],
              ["Parent note", "Observation trends help shape the next calm routine, not labels."],
            ].map(([label, detail], index) => (
              <div key={label} className={cn("rounded-[var(--radius-md)] p-4", index === 0 ? "bg-snow-primary-soft" : index === 1 ? "bg-snow-ice" : "bg-snow-surface-soft")}>
                <p className="text-xs font-black uppercase tracking-wide text-snow-muted">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </SnowCard>

      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_300px]">
        <SnowCard className="flex min-h-[460px] flex-col overflow-hidden p-3">
          <div className="border-b border-snow-border px-2 pb-3">
            <h2 className="text-base font-black text-snow-primary-dark">Observed moments</h2>
            <p className="mt-1 text-xs font-semibold text-snow-muted">Choose one note to see the parent-safe context.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["settled", "Settled"],
                ["needs-time", "Needs time"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value as typeof activeFilter)}
                  className={cn(
                    "snow-focus-ring rounded-full px-3 py-1.5 text-xs font-black transition",
                    activeFilter === value ? "bg-snow-primary text-white" : "bg-snow-primary-soft text-snow-primary-dark hover:bg-snow-lavender",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 snow-scrollbar">
            {Object.entries(groupedEmotions).map(([day, items]) => (
              <div key={day} className="pb-4">
                <p className="px-2 pb-2 text-[11px] font-black uppercase tracking-wide text-snow-muted">{day}</p>
                <div className="space-y-2">
                  {items.map((emotion) => {
                    const isActive = emotion.id === activeEmotionId;

                    return (
                      <button
                        key={emotion.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveEmotionId(emotion.id)}
                        className={cn(
                          "snow-focus-ring snow-interactive-card relative w-full rounded-[var(--radius-md)] border p-4 pl-9 text-left",
                          isActive ? "border-snow-primary bg-snow-primary-soft" : "border-snow-border bg-snow-surface"
                        )}
                      >
                        <span className={cn("absolute left-4 top-5 size-2.5 rounded-full", isActive ? "bg-snow-primary" : "bg-snow-aqua")} />
                        <span className="absolute bottom-3 left-[18px] top-8 w-px bg-snow-border" />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black capitalize text-snow-primary-dark">{emotion.emotion}</span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-snow-muted">
                            <Clock className="size-3" />
                            {formatSnowDateTime(emotion.timestamp).split(", ").at(-1)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">{emotion.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SnowCard>

        <div className="space-y-4">
          {activeEmotion ? (
            <SnowCard className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn("grid size-11 shrink-0 place-items-center rounded-full text-white", activeEmotion.emotion === "calm" ? "bg-snow-primary" : activeEmotion.emotion === "happy" ? "bg-snow-warning" : "bg-snow-aqua")}>
                  <Activity className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Selected observation</p>
                  <h2 className="mt-2 text-[22px] font-black capitalize text-snow-primary-dark">{activeEmotion.emotion}</h2>
                  <p className="mt-1 text-sm font-semibold text-snow-muted">{formatSnowDateTime(activeEmotion.timestamp)}</p>
                  <p className="mt-4 text-sm font-semibold leading-7 text-snow-primary-dark">{activeEmotion.note}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-t border-snow-border pt-4 sm:grid-cols-3">
                {[
                  ["Observed during", "Guided practice"],
                  ["Parent action", "Keep context"],
                  ["Follow-up", "Short prompt"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[var(--radius-md)] bg-snow-surface-soft px-3 py-2">
                    <p className="text-[11px] font-black text-snow-muted">{label}</p>
                    <p className="mt-1 text-xs font-black text-snow-primary-dark">{value}</p>
                  </div>
                ))}
              </div>
            </SnowCard>
          ) : null}

          <SnowCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-snow-primary-dark">What to keep</h2>
              <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">Parent-safe</span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {[
                "Continue using short, visual prompts during changes in activity.",
                "Keep familiar openings available before practice work.",
                "Let one routine step stay visible before introducing the next one.",
                "Use the transcript only as context for the next calm follow-up.",
              ].map((item) => (
                <div key={item} className="rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-sm font-semibold leading-6 text-snow-primary-dark">
                  {item}
                </div>
              ))}
            </div>
          </SnowCard>
        </div>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Pattern this week</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">Steadier responses tended to follow shorter transitions and familiar opening cues.</p>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Follow-up idea</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">Use one calm pause before switching from stories to practice tasks.</p>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Timeline reading rule</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">Entries remain observational. They highlight pacing, comfort, and transitions rather than diagnoses or scores.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
