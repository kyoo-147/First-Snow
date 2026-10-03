"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PageHeader, ParentPageFrame } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  fetchDashboardAlerts,
  fetchDashboardAttempts,
  fetchDashboardProgress,
  fetchDashboardRoutines,
  fetchHouseholdChildren,
  getErrorMessage,
  localDateKey,
  type DashboardAlert,
  type DashboardAttempt,
  type DashboardChild,
  type DashboardProgress,
  type DashboardRoutine,
} from "@/lib/dashboard-client";
import { cn } from "@/lib/utils";

type TimelineItem = {
  time: string;
  title: string;
  detail: string;
  tag: string;
  icon: typeof BookOpen;
};

export function ParentDashboard() {
  const router = useRouter();
  const [children, setChildren] = useState<DashboardChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [progress, setProgress] = useState<DashboardProgress | null>(null);
  const [attempts, setAttempts] = useState<DashboardAttempt[]>([]);
  const [routines, setRoutines] = useState<DashboardRoutine[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const list = await fetchHouseholdChildren();
        if (ignore) return;
        setChildren(list);
        if (list.length === 0) {
          setSelectedChildId(null);
          setIsLoading(false);
          return;
        }

        const activeId = selectedChildId && list.some((c) => c.id === selectedChildId)
          ? selectedChildId
          : list[0].id;
        setSelectedChildId(activeId);

        const today = localDateKey();
        const [progressData, attemptsData, routinesData, alertsData] = await Promise.all([
          fetchDashboardProgress(activeId).catch(() => ({
            childId: activeId,
            lessonsCompleted: 0,
            totalLessons: 0,
            practiceTimeMinutes: 0,
          })),
          fetchDashboardAttempts(activeId).catch(() => []),
          fetchDashboardRoutines(activeId, today).catch(() => []),
          fetchDashboardAlerts(activeId).catch(() => []),
        ]);

        if (ignore) return;
        setProgress(progressData);
        setAttempts(attemptsData);
        setRoutines(routinesData);
        setAlerts(alertsData);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(getErrorMessage(err));
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [selectedChildId, reloadKey]);

  const selectedChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  // Aggregate stats from real records
  const totalRoutineSteps = useMemo(() => {
    return routines.reduce((sum, r) => sum + r.steps.length, 0);
  }, [routines]);

  const completedRoutineSteps = useMemo(() => {
    return routines.reduce((sum, r) => sum + r.steps.filter((s) => s.isCompleted).length, 0);
  }, [routines]);

  const completedAttempts = useMemo(() => {
    return attempts.filter((a) => a.status === "completed");
  }, [attempts]);

  const latestCompletedLesson = useMemo(() => {
    return completedAttempts[0] ?? null;
  }, [completedAttempts]);

  // Build truthful chronological activity timeline
  const activityTimeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add attempts
    for (const attempt of attempts.slice(0, 5)) {
      const dateStr = attempt.completedAt || attempt.startedAt || attempt.createdAt;
      const time = dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today";
      items.push({
        time,
        title: `Lesson: ${attempt.lessonTitle}`,
        detail:
          attempt.status === "completed"
            ? `Completed${attempt.score !== null ? ` with score ${attempt.score}%` : ""}`
            : "In progress",
        tag: attempt.status === "completed" ? "Done" : "Practicing",
        icon: BookOpen,
      });
    }

    // Add completed routine steps
    for (const routine of routines) {
      for (const step of routine.steps) {
        if (step.isCompleted) {
          items.push({
            time: routine.scheduledTime || "Today",
            title: `Routine: ${step.title}`,
            detail: `${step.durationMinutes} min step completed`,
            tag: "Routine",
            icon: CalendarCheck,
          });
        }
      }
    }

    // Add alerts
    for (const alert of alerts.slice(0, 3)) {
      const time = alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Notice";
      items.push({
        time,
        title: alert.title,
        detail: alert.description,
        tag: alert.severity.toUpperCase(),
        icon: Heart,
      });
    }

    return items;
  }, [attempts, routines, alerts]);

  // Truthful suggestions based on actual state
  const nextSteps = useMemo(() => {
    const steps: string[] = [];
    if (!progress || progress.lessonsCompleted === 0) {
      steps.push("Start with an introductory lesson in the practice catalog.");
    } else {
      steps.push("Explore the next recommended lesson together.");
    }
    if (totalRoutineSteps > 0 && completedRoutineSteps < totalRoutineSteps) {
      steps.push(`Complete the remaining ${totalRoutineSteps - completedRoutineSteps} routine step(s) for today.`);
    } else if (totalRoutineSteps === 0) {
      steps.push("Set up a gentle daily routine in routine settings.");
    }
    if (alerts.length > 0) {
      steps.push("Review new companion safety alerts in the parent alert center.");
    } else {
      steps.push("Encourage a calm companion conversation before bedtime.");
    }
    return steps;
  }, [progress, totalRoutineSteps, completedRoutineSteps, alerts.length]);

  if (isLoading && children.length === 0) {
    return (
      <ParentPageFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <Loader2 className="size-8 animate-spin text-snow-primary" />
          <p className="mt-4 text-sm font-bold text-snow-muted">Loading household overview...</p>
        </div>
      </ParentPageFrame>
    );
  }

  if (error && children.length === 0) {
    return (
      <ParentPageFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="size-10 text-snow-error" />
          <h2 className="mt-3 text-lg font-black text-snow-primary-dark">Unable to load parent dashboard</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          <SnowButton variant="soft" onClick={reload} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try again
          </SnowButton>
        </div>
      </ParentPageFrame>
    );
  }

  if (children.length === 0) {
    return (
      <ParentPageFrame>
        <PageHeader
          eyebrow="Parent portal"
          title="Household overview"
          description="A calm daily view of how your household learns, responds, and moves through sessions with AgentKid."
        />
        <EmptyState
          icon={UserRound}
          title="No children in household"
          description="Add your first child profile to start tracking daily routines, lesson practice, and companion check-ins."
          actionLabel="Add child profile"
          onAction={() => {
            router.push("/parent/children");
          }}
          className="mt-8 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-12"
        />
      </ParentPageFrame>
    );
  }

  const childName = selectedChild?.name ?? "Child";

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Parent portal"
        title={`${childName}'s day`}
        description={`A calm daily view of how ${childName} learned, responded, and moved through today's sessions with AgentKid.`}
        action={
          selectedChild ? (
            <SnowCard className="w-full min-w-[300px] p-4">
              <div className="flex items-center gap-3">
                <Image
                  src={selectedChild.avatarUrl || "/images/snow-avatar-final.png"}
                  alt={selectedChild.name}
                  width={52}
                  height={52}
                  className="rounded-full bg-snow-ice object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-snow-primary-dark">{selectedChild.name}</p>
                    {children.length > 1 && (
                      <select
                        aria-label="Select child"
                        value={selectedChild.id}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="rounded-lg border border-snow-border bg-snow-surface-soft px-2 py-1 text-xs font-bold text-snow-primary-dark"
                      >
                        {children.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="snow-body-small snow-font-readable font-bold text-snow-muted">
                    {selectedChild.age ? `Age ${selectedChild.age}` : "Age not set"}{" "}
                    {selectedChild.grade ? `• ${selectedChild.grade}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href={`/parent/children/${selectedChild.id}/sessions`}
                  className="snow-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-snow-border text-xs font-black text-snow-primary-dark"
                >
                  <UserRound className="size-3.5" /> Review
                </Link>
                <Link
                  href="/session/home"
                  className="snow-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-snow-primary text-xs font-black text-white"
                >
                  <Sparkles className="size-3.5" /> Open app
                </Link>
              </div>
            </SnowCard>
          ) : null
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-md)] bg-snow-error-soft p-4 text-snow-error">
          <p className="text-sm font-bold">{error}</p>
          <SnowButton variant="ghost" className="min-h-9 px-3 text-xs" onClick={reload}>
            <RefreshCw className="mr-1 size-3.5" /> Retry
          </SnowButton>
        </div>
      )}

      {/* Top statistics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnowCard className="relative h-full min-h-[150px] overflow-hidden bg-snow-primary-soft p-5">
          <div className="relative z-10 flex h-full items-start justify-between gap-3">
            <div className="max-w-[65%]">
              <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">Routines completed</p>
              <p className="mt-3 text-[clamp(1.6rem,1.7vw,2rem)] font-black leading-tight text-snow-primary-dark">
                {totalRoutineSteps > 0 ? `${completedRoutineSteps} / ${totalRoutineSteps}` : "0 / 0"}
              </p>
              <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">
                {routines.length > 0 ? `${routines.length} routine(s) scheduled` : "No routines scheduled today"}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-snow-surface/80">
              <CalendarCheck className="size-5 text-snow-primary-dark" />
            </div>
          </div>
          <Image
            src="/images/snow-mascot-ui.png"
            alt=""
            width={120}
            height={120}
            className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-90"
          />
        </SnowCard>

        <SnowCard className="relative h-full min-h-[150px] overflow-hidden bg-snow-ice p-5">
          <div className="relative z-10 flex h-full items-start justify-between gap-3">
            <div className="max-w-[65%]">
              <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">Lessons practiced</p>
              <p className="mt-3 text-[clamp(1.6rem,1.7vw,2rem)] font-black leading-tight text-snow-primary-dark">
                {progress?.lessonsCompleted ?? 0}
              </p>
              <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">
                {progress?.totalLessons ? `Out of ${progress.totalLessons} available` : "Catalog active"}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-snow-surface/80">
              <BookOpen className="size-5 text-snow-primary-dark" />
            </div>
          </div>
          <Image
            src="/images/lesson-math.png"
            alt=""
            width={120}
            height={120}
            className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-90"
          />
        </SnowCard>

        <SnowCard className="relative h-full min-h-[150px] overflow-hidden bg-snow-aqua/35 p-5">
          <div className="relative z-10 flex h-full items-start justify-between gap-3">
            <div className="max-w-[65%]">
              <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">Safety alerts</p>
              <p className="mt-3 text-[clamp(1.6rem,1.7vw,2rem)] font-black leading-tight text-snow-primary-dark">
                {alerts.length}
              </p>
              <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">
                {alerts.length === 0 ? "No active alerts" : "Review needed in portal"}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-snow-surface/80">
              <Heart className="size-5 text-snow-primary-dark" />
            </div>
          </div>
          <Image
            src="/images/taking_deep_breaths_illustration.png"
            alt=""
            width={120}
            height={120}
            className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-90"
          />
        </SnowCard>

        <SnowCard className="relative h-full min-h-[150px] overflow-hidden bg-snow-lavender p-5">
          <div className="relative z-10 flex h-full items-start justify-between gap-3">
            <div className="max-w-[65%]">
              <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">Total practice time</p>
              <p className="mt-3 text-[clamp(1.6rem,1.7vw,2rem)] font-black leading-tight text-snow-primary-dark">
                {progress?.practiceTimeMinutes ?? 0} min
              </p>
              <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">
                Logged across completed lessons
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-snow-surface/80">
              <Clock className="size-5 text-snow-primary-dark" />
            </div>
          </div>
          <Image
            src="/images/snow-connected-care.png"
            alt=""
            width={120}
            height={120}
            className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-90"
          />
        </SnowCard>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.86fr)_340px]">
        <div className="space-y-4">
          <SnowCard className="snow-card-pad">
            <div className="flex items-center justify-between gap-4 border-b border-snow-border pb-4">
              <div>
                <h2 className="snow-heading font-black text-snow-primary-dark">Today&apos;s activity timeline</h2>
                <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                  A parent-safe sequence of how {childName} moved through the day.
                </p>
              </div>
              {selectedChild && (
                <Link
                  href={`/parent/children/${selectedChild.id}/timeline`}
                  className="rounded-full bg-snow-primary-soft px-3 py-1.5 text-xs font-black text-snow-primary"
                >
                  View full timeline
                </Link>
              )}
            </div>

            {activityTimeline.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="mx-auto size-8 text-snow-muted opacity-50" />
                <p className="mt-2 text-sm font-bold text-snow-muted">No activity recorded today yet for {childName}.</p>
                <p className="snow-body-small mt-1 text-snow-muted">
                  When {childName} completes lessons, routines, or check-ins, they will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-0">
                {activityTimeline.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.time}-${item.title}-${index}`} className="grid grid-cols-[76px_34px_minmax(0,1fr)] gap-3">
                      <p className="pt-3 text-xs font-black text-snow-muted">{item.time}</p>
                      <div className="flex flex-col items-center">
                        <span className="grid size-8 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
                          <Icon className="size-4" />
                        </span>
                        {index < activityTimeline.length - 1 ? <span className="h-12 w-px bg-snow-border" /> : null}
                      </div>
                      <div className="pb-4 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-snow-primary-dark">{item.title}</p>
                          <span className="rounded-full bg-snow-surface-soft px-2 py-1 text-[11px] font-black text-snow-primary-dark">
                            {item.tag}
                          </span>
                        </div>
                        <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{item.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SnowCard>

          <SnowCard className="overflow-hidden">
            <div className="p-5">
              <h2 className="snow-heading font-black text-snow-primary-dark">Latest accomplishment</h2>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                {latestCompletedLesson ? `${childName}'s recent completed lesson.` : "No completed lessons yet."}
              </p>
            </div>
            {latestCompletedLesson ? (
              <>
                <div className="relative mx-5 h-44 overflow-hidden rounded-[var(--radius-lg)] bg-snow-ice">
                  <Image src="/images/lesson-story.png" alt="" fill sizes="560px" className="object-cover" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-snow-surface text-snow-primary shadow-[var(--shadow-card)]">
                      <PlayCircle className="size-7" />
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-sm font-black text-snow-primary-dark">{latestCompletedLesson.lessonTitle}</p>
                  <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                    {latestCompletedLesson.score !== null ? `Score: ${latestCompletedLesson.score}%` : "Completed"}
                    {latestCompletedLesson.completedAt ? ` • ${new Date(latestCompletedLesson.completedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-sm font-semibold text-snow-muted">
                Once {childName} completes a lesson, their certificate and score will be spotlighted here.
              </div>
            )}
          </SnowCard>
        </div>

        <div className="space-y-4">
          <SnowCard className="snow-card-pad">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="snow-heading font-black text-snow-primary-dark">Learning steadiness</h2>
                <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                  Daily consistency and calm practice tracking.
                </p>
              </div>
              <span className="rounded-full bg-snow-ice px-3 py-1.5 text-xs font-black text-snow-primary-dark">
                This week
              </span>
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
              <p className="text-xs font-black uppercase text-snow-muted">Active status</p>
              <p className="mt-1 text-sm font-semibold text-snow-primary-dark">
                {selectedChild?.isActive ? "Child profile active and ready for sessions." : "Child profile deactivated."}
              </p>
              <p className="mt-2 text-xs text-snow-muted">
                {progress?.lessonsCompleted ?? 0} lesson(s) completed • {progress?.practiceTimeMinutes ?? 0} minutes total
              </p>
            </div>
          </SnowCard>

          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading font-black text-snow-primary-dark">Suggested next steps</h2>
            <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
              Simple ideas to support {childName}&apos;s calm learning block.
            </p>
            <div className="mt-4 space-y-3">
              {nextSteps.map((step) => (
                <div
                  key={step}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3 text-left",
                  )}
                >
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-snow-primary" />
                  <p className="snow-body-copy snow-font-readable font-semibold text-snow-primary-dark">{step}</p>
                </div>
              ))}
            </div>
          </SnowCard>
        </div>

        <aside className="space-y-4">
          <SnowCard className="snow-card-pad bg-snow-ice/55">
            <h2 className="snow-heading flex items-center gap-2 font-black text-snow-primary-dark">
              <Heart className="size-5 text-snow-primary" /> What AgentKid noticed
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[var(--radius-md)] bg-snow-surface p-4">
                <p className="text-sm font-black text-snow-primary-dark">Pacing and consistency</p>
                <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
                  {progress?.lessonsCompleted
                    ? `${childName} has completed ${progress.lessonsCompleted} lesson(s) with ${progress.practiceTimeMinutes} minutes of practice.`
                    : `${childName} is ready for their first guided lesson session.`}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-snow-surface p-4">
                <p className="text-sm font-black text-snow-primary-dark">Daily routines</p>
                <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
                  {totalRoutineSteps > 0
                    ? `${completedRoutineSteps} of ${totalRoutineSteps} steps finished for today.`
                    : "No routine steps scheduled today. Routines help build steady habits."}
                </p>
              </div>
            </div>
          </SnowCard>

          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading font-black text-snow-primary-dark">Safety & controls</h2>
            <div className="mt-4 space-y-3">
              {[
                { title: "Parent privacy center", href: "/parent/privacy" },
                { title: "Emergency contacts", href: "/parent/settings/emergency" },
                { title: "Companion alerts", href: "/parent/alerts" },
                {
                  title: selectedChild ? "Daily routine manager" : "Routines",
                  href: selectedChild ? `/parent/children/${selectedChild.id}/routines` : "/parent/children",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3 transition hover:border-snow-primary"
                >
                  <p className="snow-body-small snow-font-readable font-bold text-snow-primary-dark">{item.title}</p>
                  <ChevronRight className="size-4 shrink-0 text-snow-primary" />
                </Link>
              ))}
            </div>
          </SnowCard>

          <SnowCard className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-4 bg-snow-lavender p-4">
            <Image src="/images/snow-mascot-ui.png" alt="" width={72} height={72} className="object-contain" />
            <div>
              <p className="text-sm font-black text-snow-primary-dark">You&apos;re doing an amazing job.</p>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
                Your support helps {childName} feel safe, curious, and ready to learn.
              </p>
            </div>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
