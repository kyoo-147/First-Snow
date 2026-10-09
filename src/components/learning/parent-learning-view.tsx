"use client";

import { useEffect, useState, useCallback } from "react";
import { t } from "@/i18n";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Star,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  fetchChildProgress,
  fetchChildAttempts,
  type ChildProgress,
  type ChildAttemptSummary,
} from "@/lib/learning-client";

interface ParentLearningViewProps {
  childId: string;
  childName?: string;
}

export function ParentLearningView({ childId, childName = "Child" }: ParentLearningViewProps) {
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [attempts, setAttempts] = useState<ChildAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!childId) return;
    let ignore = false;

    async function load() {
      try {
        const [progressData, attemptsData] = await Promise.all([
          fetchChildProgress(childId),
          fetchChildAttempts(childId),
        ]);
        if (!ignore) {
          setProgress(progressData);
          setAttempts(attemptsData);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : t("parent", "learningView.unableToLoad")
          );
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [childId, reloadKey]);

  const skillsToDisplay = progress?.skills && progress.skills.length > 0 ? progress.skills : [];

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "learningView.eyebrow", { name: childName })}
        title={t("parent", "learningView.title")}
        description={t("parent", "learningView.description", { name: childName })}
        action={
          <SnowButton variant="soft" onClick={loadData}>
            <BarChart3 className="mr-2 size-4" />{t("parent", "learningView.refreshData")}</SnowButton>
        }
      />

      {isLoading ? (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] bg-snow-surface p-12 text-center shadow-[var(--shadow-card)]">
            <div className="grid size-12 place-items-center rounded-full bg-snow-primary-soft text-snow-primary animate-spin">
              <RefreshCw className="size-6" />
            </div>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">{t("parent", "learningView.loadingAnalytics")}</p>
            <p className="text-sm font-semibold text-snow-muted">{t("parent", "learningView.fetchingRecords")}</p>
          </div>
        </div>
      ) : error ? (
        <div className="py-6">
          <div className="rounded-[var(--radius-xl)] border border-snow-warning/30 bg-snow-cream p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-snow-warning/20 text-snow-primary-dark">
              <AlertCircle className="size-6" />
            </div>
            <h2 className="mt-3 text-lg font-black text-snow-primary-dark">{t("parent", "learningView.unableToLoad")}</h2>
            <p className="mt-1 text-sm font-semibold text-snow-muted">{error}</p>
            <div className="mt-5 flex justify-center">
              <SnowButton onClick={loadData} className="gap-2">
                <RefreshCw className="size-4" />{t("parent", "learningView.tryAgain")}</SnowButton>
            </div>
          </div>
        </div>
      ) : !progress && attempts.length === 0 ? (
        <div className="py-6">
          <EmptyState
            title={t("parent", "learningView.noLearningHistory")}
            description={t("parent", "learningView.noLessonsCompleted", { name: childName })}
            actionLabel={t("parent", "learningView.checkAgain")}
            onAction={loadData}
          />
        </div>
      ) : (
        <>
          {/* Status Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatusTile
              label={t("parent", "learningView.practiceTime")}
              value={`${progress?.practiceTimeMinutes ?? 0} ${t("parent", "learningView.minutesUnit")}`}
              detail={t("parent", "learningView.recordedLearningTime")}
              icon={<Clock className="size-5 text-snow-primary" />}
            />
            <StatusTile
              label={t("parent", "learningView.lessonsCompleted")}
              value={`${progress?.lessonsCompleted ?? attempts.filter((a) => a.status === "completed").length}`}
              detail={progress?.totalLessons ? t("parent", "learningView.ofAvailable", { total: progress.totalLessons }) : t("parent", "learningView.totalFinished")}
              icon={<BookOpen className="size-5 text-snow-primary" />}
              tone="bg-snow-ice"
            />
            <StatusTile
              label={t("parent", "learningView.comfortPattern")}
              value={progress?.comfortPattern || "—"}
              detail={progress?.comfortPattern ? t("parent", "learningView.shortVisualChoices") : t("parent", "learningView.notRecordedYet")}
              icon={<Star className="size-5 text-snow-primary" />}
              tone="bg-snow-lavender"
            />
            <StatusTile
              label={t("parent", "learningView.nextFocus")}
              value={progress?.nextFocus || "—"}
              detail={progress?.nextFocus ? t("parent", "learningView.recommendedReview") : t("parent", "learningView.notEnoughData")}
              icon={<GraduationCap className="size-5 text-snow-primary" />}
              tone="bg-snow-cream"
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Skill Map Card */}
            <SnowCard className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-snow-primary-dark">{t("parent", "learningView.skillMap")}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                    {t("parent", "learningView.progressCoverage")}
                  </p>
                </div>
                <span className="rounded-full bg-snow-primary-soft px-3 py-1.5 text-xs font-black text-snow-primary">
                  {t("parent", "learningView.currentWeek")}
                </span>
              </div>
              <div className="mt-5 grid gap-4 2xl:grid-cols-2">
                {skillsToDisplay.length === 0 ? (
                  <div className="col-span-full rounded-[var(--radius-md)] border border-dashed border-snow-border bg-snow-surface-soft p-6 text-center">
                    <p className="text-sm font-semibold text-snow-muted">
                      {t("parent", "learningView.noSkillPractice")}
                    </p>
                  </div>
                ) : (
                  skillsToDisplay.map((skill) => (
                    <div
                      key={skill.label}
                      className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-snow-primary-dark">{skill.label}</p>
                        <p className="text-xs font-bold text-snow-muted">{skill.value}%</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-snow-surface">
                        <div className="h-full rounded-full bg-snow-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }} />
                      </div>
                      {skill.note && (
                        <p className="mt-1 text-xs font-semibold text-snow-muted">{skill.note}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SnowCard>

            {/* Sidebar: Next steps and Recent attempts */}
            <aside className="space-y-4">
              <SnowCard className="p-5">
                <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "learningView.suggestedNextStep")}</h2>
                {progress?.nextFocus ? (
                  <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                    {t("parent", "learningView.focusOnActivities", { focus: progress.nextFocus.toLowerCase() })}
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                    {t("parent", "learningView.notEnoughSuggest")}
                  </p>
                )}
                <div className="mt-4 rounded-full bg-snow-primary-soft px-4 py-2 text-xs font-black text-snow-primary inline-block">
                  {t("parent", "learningView.guidedByAgentKid")}
                </div>
              </SnowCard>

              <SnowCard className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "learningView.recentAttempts")}</h2>
                  <span className="text-xs font-bold text-snow-muted">{t("parent", "learningView.logged", { count: attempts.length })}</span>
                </div>
                {attempts.length === 0 ? (
                  <p className="mt-3 text-sm font-semibold text-snow-muted">{t("parent", "learningView.noRecentAttempts")}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {attempts.slice(0, 5).map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-3 py-3"
                      >
                        {att.status === "completed" ? (
                          <CheckCircle2 className="size-4 shrink-0 text-snow-success" />
                        ) : (
                          <Clock className="size-4 shrink-0 text-snow-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-snow-primary-dark">
                            {att.lessonTitle || t("parent", "learningView.lesson", { id: att.lessonId.slice(0, 8) })}
                          </p>
                          <p className="text-xs font-semibold text-snow-muted">
                            {att.status === "completed"
                              ? (att.score !== undefined && att.score !== null ? t("parent", "learningView.completedScore", { score: att.score }) : t("parent", "learningView.completed"))
                              : t("parent", "learningView.inProgress")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SnowCard>
            </aside>
          </div>
        </>
      )}
    </ParentPageFrame>
  );
}
