"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, RefreshCw, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { SnowButton } from "@/components/ui/snow-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressStrip } from "@/components/ui/progress-strip";
import {
  fetchChildProgress,
  fetchChildRewards,
  fetchSessionChild,
  type ChildProgress,
  type ChildReward,
} from "@/lib/learning-client";

function formatMinutes(total: number): string {
  if (!total) return "0 min";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function ProgressScreen() {
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [rewards, setRewards] = useState<ChildReward[]>([]);
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
            setError("Sign in with a child profile to see your progress.");
            setIsLoading(false);
          }
          return;
        }
        const [progressData, rewardData] = await Promise.all([
          fetchChildProgress(child.id),
          fetchChildRewards(child.id),
        ]);
        if (!cancelled) {
          setProgress(progressData);
          setRewards(rewardData);
          setIsLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load your progress.");
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const skills = progress?.skills ?? [];
  const stars = rewards.filter((reward) => reward.type === "star").length;
  const hasActivity = (progress?.lessonsCompleted ?? 0) > 0 || rewards.length > 0 || skills.length > 0;

  const stats = [
    {
      label: "Lessons done",
      value: `${progress?.lessonsCompleted ?? 0}`,
      detail: progress?.totalLessons ? `of ${progress.totalLessons} available` : "Total finished",
      icon: <Target className="size-5 text-snow-primary" />,
      color: "bg-snow-primary/20 text-snow-primary",
    },
    {
      label: "Stars earned",
      value: `${stars}`,
      detail: "Completed lesson rewards",
      icon: <Star className="size-5 fill-snow-warning text-snow-warning" />,
      color: "bg-snow-warning/20 text-snow-warning",
    },
    {
      label: "Total rewards",
      value: `${rewards.length}`,
      detail: "All reward types",
      icon: <Sparkles className="size-5 text-snow-aqua" />,
      color: "bg-snow-aqua/20 text-snow-aqua",
    },
    {
      label: "Time learned",
      value: formatMinutes(progress?.practiceTimeMinutes ?? 0),
      detail: "Recorded lesson time",
      icon: <Clock className="size-5 text-snow-primary" />,
      color: "bg-snow-lavender text-snow-primary",
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="mb-2">
        <h1 className="mb-2 text-4xl font-black text-snow-primary-dark">My Progress</h1>
        <p className="text-sm font-bold text-snow-muted">A calm look at your learning journey and achievements.</p>
      </div>

      {error ? (
        <div className="py-6">
          <div className="rounded-[var(--radius-xl)] border border-snow-warning/30 bg-snow-cream p-6 text-center">
            <p className="text-sm font-bold text-snow-primary-dark">{error}</p>
            <div className="mt-5 flex justify-center">
              <SnowButton variant="soft" onClick={reload} className="gap-2">
                <RefreshCw className="size-4" />
                Try again
              </SnowButton>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div role="status" aria-busy="true" className="flex items-center justify-center gap-3 py-12 text-snow-muted">
          <Loader2 className="size-6 animate-spin text-snow-primary" />
          <span className="text-sm font-bold">Loading your progress…</span>
        </div>
      ) : !hasActivity ? (
        <SnowCard className="p-2">
          <EmptyState
            icon={TrendingUp}
            title="No progress yet"
            description="Finish a lesson with AgentKid and your progress will show up here."
            actionLabel="Check again"
            onAction={reload}
          />
        </SnowCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <SnowCard key={stat.label} className="flex flex-col items-center justify-center p-5 text-center">
                <div className={`mb-3 grid size-12 place-items-center rounded-2xl ${stat.color}`}>
                  {stat.icon}
                </div>
                <p className="mb-1 text-3xl font-black text-snow-primary-dark">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-snow-muted">{stat.label}</p>
                <p className="mt-1 text-[11px] font-semibold text-snow-muted">{stat.detail}</p>
              </SnowCard>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SnowCard className="flex flex-col p-6 lg:col-span-2">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-snow-primary-dark">
                <TrendingUp className="size-5 text-snow-primary" /> Practice coverage
              </h2>
              {skills.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-snow-border bg-snow-surface-soft p-6 text-center">
                  <p className="text-sm font-semibold text-snow-muted">
                    No practice records yet. Completed lessons will fill in each subject here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {skills.map((skill) => (
                    <div key={skill.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-snow-primary-dark">
                        <span>{skill.label}</span>
                        <span className="text-xs font-bold text-snow-muted">{skill.value}%</span>
                      </div>
                      <ProgressStrip value={skill.value} />
                      {skill.note ? <p className="mt-1 text-xs font-semibold text-snow-muted">{skill.note}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </SnowCard>

            <SnowCard className="flex flex-col p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-snow-primary-dark">
                <Star className="size-4 text-snow-warning" /> Recent rewards
              </h2>
              {rewards.length === 0 ? (
                <p className="text-sm font-semibold text-snow-muted">No rewards collected yet.</p>
              ) : (
                <div className="space-y-3">
                  {rewards.slice(0, 5).map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-3 py-3"
                    >
                      <Star className="size-4 shrink-0 fill-snow-warning text-snow-warning" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-snow-primary-dark">{reward.label}</p>
                        <p className="text-xs font-semibold text-snow-muted">
                          {new Date(reward.awardedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SnowCard>
          </div>
        </>
      )}
    </div>
  );
}
