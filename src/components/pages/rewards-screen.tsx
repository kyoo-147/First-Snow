"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, RefreshCw, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { SnowButton } from "@/components/ui/snow-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  fetchChildRewards,
  fetchSessionChild,
  type ChildReward,
  type RewardType,
} from "@/lib/learning-client";

const rewardStyles: Record<RewardType, { label: string; icon: typeof Star; color: string; bg: string }> = {
  star: { label: "Star", icon: Star, color: "text-snow-warning", bg: "bg-snow-warning/20" },
  badge: { label: "Badge", icon: Trophy, color: "text-snow-primary", bg: "bg-snow-primary/20" },
  streak: { label: "Streak", icon: Zap, color: "text-snow-aqua", bg: "bg-snow-aqua/20" },
  milestone: { label: "Milestone", icon: Heart, color: "text-snow-peach", bg: "bg-snow-peach/20" },
};

export function RewardsScreen() {
  const [rewards, setRewards] = useState<ChildReward[]>([]);
  const [childName, setChildName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const child = await fetchSessionChild();
        if (!child) {
          if (!cancelled) {
            setError("Sign in with a child profile to see your rewards.");
            setIsLoading(false);
          }
          return;
        }
        const earned = await fetchChildRewards(child.id);
        if (!cancelled) {
          setChildName(child.name);
          setRewards(earned);
          setIsLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load your rewards.");
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const stars = rewards.filter((reward) => reward.type === "star").length;

  return (
    <div className="flex h-full flex-col gap-8 overflow-hidden">
      <SnowCard className="relative overflow-hidden border-snow-warning/20 bg-gradient-to-br from-snow-cream to-snow-surface p-8">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
          <Trophy className="size-64 rotate-12 text-snow-warning" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row">
          <div className="flex size-40 shrink-0 items-center justify-center rounded-full bg-snow-warning/20">
            <Star className="size-20 fill-snow-warning text-snow-warning" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-snow-warning/10 px-3 py-1">
              <Sparkles className="size-4 text-snow-warning" />
              <span className="text-xs font-black uppercase tracking-wide text-snow-warning">Rewards</span>
            </div>
            <h1 className="mb-4 text-4xl font-black text-snow-primary-dark">
              {childName ? `Great work, ${childName}!` : "Your rewards"}
            </h1>
            <p className="max-w-lg text-base font-bold leading-relaxed text-snow-muted">
              {isLoading
                ? "Loading your rewards…"
                : rewards.length > 0
                  ? `You have earned ${rewards.length} reward${rewards.length === 1 ? "" : "s"} so far, including ${stars} star${stars === 1 ? "" : "s"}.`
                  : "Finish a lesson with AgentKid to earn your first reward."}
            </p>
          </div>
        </div>
      </SnowCard>

      {error ? (
        <div role="alert" className="rounded-[var(--radius-xl)] border border-snow-warning/30 bg-snow-cream p-6 text-center">
          <p className="text-sm font-bold text-snow-primary-dark">{error}</p>
          <div className="mt-5 flex justify-center">
            <SnowButton variant="soft" onClick={reload} className="gap-2">
              <RefreshCw className="size-4" />
              Try again
            </SnowButton>
          </div>
        </div>
      ) : isLoading ? (
        <div role="status" aria-busy="true" className="flex items-center justify-center gap-3 py-12 text-snow-muted">
          <Loader2 className="size-6 animate-spin text-snow-primary" />
          <span className="text-sm font-bold">Loading your rewards…</span>
        </div>
      ) : rewards.length === 0 ? (
        <SnowCard className="p-2">
          <EmptyState
            icon={Sparkles}
            title="No rewards yet"
            description="Complete a lesson and AgentKid will add your first star here."
            actionLabel="Check again"
            onAction={reload}
          />
        </SnowCard>
      ) : (
        <div>
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-snow-primary-dark">
            Earned rewards
            <span className="ml-2 rounded-full bg-snow-surface-soft px-2 py-1 text-sm font-bold text-snow-muted">
              {rewards.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const style = rewardStyles[reward.type];
              const Icon = style.icon;
              return (
                <SnowCard key={reward.id} className="flex items-center gap-4 p-5">
                  <div className={`grid size-14 shrink-0 place-items-center rounded-2xl ${style.bg}`}>
                    <Icon className={`size-7 ${style.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-snow-primary-dark">{reward.label}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-snow-muted">
                      {style.label} · {new Date(reward.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                </SnowCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
