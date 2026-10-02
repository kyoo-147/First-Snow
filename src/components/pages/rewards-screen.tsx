import { Check, Heart, Lock, Shield, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function RewardsScreen() {
  const currentXP = 2450;
  const targetXP = 3000;
  const progressPercent = (currentXP / targetXP) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const badges = [
    { id: 1, title: "Super Speller", iconText: "A+", color: "text-snow-primary", bg: "bg-snow-primary/20", locked: false },
    { id: 2, title: "Kind Friend", icon: Heart, color: "text-snow-peach", bg: "bg-snow-peach/20", locked: false },
    { id: 3, title: "Quick Thinker", icon: Zap, color: "text-snow-warning", bg: "bg-snow-warning/20", locked: false },
    { id: 4, title: "Math Wizard", icon: Lock, color: "text-snow-muted", bg: "bg-snow-surface-soft", locked: true },
    { id: 5, title: "Story Teller", icon: Lock, color: "text-snow-muted", bg: "bg-snow-surface-soft", locked: true },
  ];

  const mapNodes = [
    { id: 1, type: "start", completed: true },
    { id: 2, type: "milestone", completed: true },
    { id: 3, type: "reward", completed: true },
    { id: 4, type: "current", completed: false },
    { id: 5, type: "milestone", completed: false },
    { id: 6, type: "reward", completed: false },
    { id: 7, type: "milestone", completed: false },
  ];

  return (
    <div className="flex h-full flex-col gap-8 overflow-hidden">
      <SnowCard className="relative overflow-hidden border-snow-warning/20 bg-gradient-to-br from-snow-cream to-snow-surface p-8">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
          <Trophy className="size-64 rotate-12 text-snow-warning" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row">
          <div className="relative flex size-48 shrink-0 items-center justify-center md:size-56">
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="50%" cy="50%" r={radius} className="fill-none stroke-snow-surface-soft" strokeWidth="16" />
              <circle cx="50%" cy="50%" r={radius} className="fill-none stroke-snow-warning transition-all duration-1000 ease-out" strokeWidth="16" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
            </svg>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="mb-1 text-sm font-black uppercase tracking-widest text-snow-warning">Level</span>
              <span className="text-6xl font-black text-snow-primary-dark">3</span>
            </div>
            <Star className="absolute left-8 top-0 size-6 animate-pulse fill-snow-warning text-snow-warning" />
            <Sparkles className="absolute bottom-4 right-4 size-5 animate-pulse text-snow-primary" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-snow-warning/10 px-3 py-1">
              <Trophy className="size-4 text-snow-warning" />
              <span className="text-xs font-black uppercase tracking-wide text-snow-warning">Little Learner</span>
            </div>
            <h1 className="mb-4 text-4xl font-black text-snow-primary-dark">You&apos;re doing amazing, Minh!</h1>
            <p className="mb-6 max-w-lg text-base font-bold leading-relaxed text-snow-muted">
              You are only 550 XP away from Level 4. Keep playing and learning to unlock more cool badges and rewards.
            </p>
            <div className="inline-flex items-center gap-4 rounded-2xl bg-snow-surface p-4 shadow-sm">
              <div className="rounded-xl bg-snow-warning/20 p-2">
                <Sparkles className="size-7 text-snow-warning" />
              </div>
              <div>
                <p className="text-sm font-bold text-snow-muted">Current XP</p>
                <p className="text-2xl font-black text-snow-warning">
                  {currentXP} <span className="text-sm font-bold text-snow-muted">/ {targetXP}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </SnowCard>

      <div>
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-snow-primary-dark">
          Your Badges <span className="ml-2 rounded-full bg-snow-surface-soft px-2 py-1 text-sm font-bold text-snow-muted">3 Earned</span>
        </h2>
        <div className="-mx-2 flex gap-6 overflow-x-auto px-2 pb-6 pt-2">
          {badges.map((badge) => {
            const Icon = "icon" in badge ? badge.icon : null;
            return (
              <div key={badge.id} className="group flex shrink-0 flex-col items-center gap-4">
                <div className={`relative flex size-28 items-center justify-center rounded-3xl ${badge.bg} transition-all duration-300 ${badge.locked ? "opacity-50 grayscale" : "shadow-[var(--shadow-card)] group-hover:-translate-y-2 group-hover:scale-105"}`}>
                  {Icon ? <Icon className={`size-10 ${badge.color}`} /> : <span className={`text-5xl font-black ${badge.color}`}>{badge.iconText}</span>}
                  {!badge.locked && (
                    <div className="absolute -right-2 -top-2 rounded-full bg-snow-surface p-1 shadow-sm">
                      <Shield className={`size-5 fill-current ${badge.color}`} />
                    </div>
                  )}
                </div>
                <p className={`text-sm font-black ${badge.locked ? "text-snow-muted" : "text-snow-primary-dark"}`}>{badge.title}</p>
              </div>
            );
          })}
          <div className="mt-2 flex size-28 shrink-0 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-snow-border text-snow-muted">
            <Sparkles className="mb-1 size-6" />
            <span className="px-2 text-center text-[10px] font-bold">Keep learning</span>
          </div>
        </div>
      </div>

      <SnowCard className="mt-2 overflow-hidden bg-snow-surface p-8">
        <h2 className="mb-10 text-center text-2xl font-black text-snow-primary-dark">Path to Level 4</h2>
        <div className="relative mx-auto flex w-full max-w-4xl items-center justify-between px-4">
          <div className="absolute left-8 right-8 top-1/2 z-0 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-snow-surface-soft">
            <div className="h-full bg-snow-warning" style={{ width: "45%" }} />
          </div>
          {mapNodes.map((node) => {
            const isReward = node.type === "reward";
            const isStart = node.type === "start";
            const isCurrent = node.type === "current";
            return (
              <div key={node.id} className="relative z-10 flex flex-col items-center">
                <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${isReward ? "size-16 z-20" : "size-10"} ${node.completed ? "bg-snow-warning ring-4 ring-white shadow-[var(--shadow-card)]" : isCurrent ? "scale-125 border-4 border-snow-warning bg-snow-surface ring-4 ring-white shadow-[var(--shadow-card)]" : "border-4 border-snow-surface-soft bg-snow-surface"}`}>
                  {isReward ? node.completed ? <Trophy className="size-6 text-white" /> : <Lock className="size-6 text-snow-muted" /> : isStart ? <span className="text-sm font-black text-white">L3</span> : isCurrent ? <span className="size-3 animate-ping rounded-full bg-snow-warning" /> : node.completed ? <Check className="size-5 text-white" /> : null}
                </div>
                <div className="absolute top-20 w-24 text-center">
                  {isReward && <span className={`text-xs font-black uppercase tracking-wide ${node.completed ? "text-snow-warning" : "text-snow-muted"}`}>Mystery Box</span>}
                  {isCurrent && <span className="text-xs font-black text-snow-primary-dark">You are here</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-16" />
      </SnowCard>
    </div>
  );
}
