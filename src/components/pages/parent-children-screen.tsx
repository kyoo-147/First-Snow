"use client";

import { t } from "@/i18n";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Clock,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createHouseholdChild,
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

export function ParentChildrenScreen() {
  const [children, setChildren] = useState<DashboardChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [progress, setProgress] = useState<DashboardProgress | null>(null);
  const [attempts, setAttempts] = useState<DashboardAttempt[]>([]);
  const [routines, setRoutines] = useState<DashboardRoutine[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Add child dialog state
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [childNameInput, setChildNameInput] = useState("");
  const [childPinInput, setChildPinInput] = useState("");
  const [childAgeInput, setChildAgeInput] = useState("");
  const [childGradeInput, setChildGradeInput] = useState("");
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);
  const [addChildError, setAddChildError] = useState<string | null>(null);

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

  const latestAttempt = useMemo(() => {
    return attempts[0] ?? null;
  }, [attempts]);

  const totalRoutineSteps = useMemo(() => {
    return routines.reduce((sum, r) => sum + r.steps.length, 0);
  }, [routines]);

  const completedRoutineSteps = useMemo(() => {
    return routines.reduce((sum, r) => sum + r.steps.filter((s) => s.isCompleted).length, 0);
  }, [routines]);

  async function handleAddChildSubmit(e: FormEvent) {
    e.preventDefault();
    setAddChildError(null);

    const trimmedName = childNameInput.trim();
    if (!trimmedName) {
      setAddChildError(t("parent", "childrenScreen.errorProvideName"));
      return;
    }

    const trimmedPin = childPinInput.trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      setAddChildError(t("parent", "childrenScreen.errorPin4Digits"));
      return;
    }

    const ageNum = childAgeInput.trim() ? parseInt(childAgeInput.trim(), 10) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 3 || ageNum > 18)) {
      setAddChildError(t("parent", "childrenScreen.errorAgeRange"));
      return;
    }

    setIsSubmittingChild(true);
    try {
      const created = await createHouseholdChild({
        name: trimmedName,
        pin: trimmedPin,
        age: ageNum ?? null,
        grade: childGradeInput.trim() || null,
      });

      setChildren((prev) => [...prev, created]);
      setSelectedChildId(created.id);
      setIsAddChildOpen(false);
      setChildNameInput("");
      setChildPinInput("");
      setChildAgeInput("");
      setChildGradeInput("");
    } catch (err) {
      setAddChildError(getErrorMessage(err));
    } finally {
      setIsSubmittingChild(false);
    }
  }

  if (isLoading && children.length === 0) {
    return (
      <ParentPageFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <Loader2 className="size-8 animate-spin text-snow-primary" />
          <p className="mt-4 text-sm font-bold text-snow-muted">{t("parent", "childrenScreen.loadingRoster")}</p>
        </div>
      </ParentPageFrame>
    );
  }

  if (error && children.length === 0) {
    return (
      <ParentPageFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="size-10 text-snow-error" />
          <h2 className="mt-3 text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.errorLoadChildren")}</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          <SnowButton variant="soft" onClick={reload} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            {t("parent", "childrenScreen.tryAgain")}
          </SnowButton>
        </div>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow={t("parent", "childrenScreen.parentPortal")}
        title={t("parent", "childrenScreen.myChildren")}
        description={t("parent", "childrenScreen.pageDescription")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/session/home"
              className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary px-5 text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition hover:brightness-105"
            >
              <Sparkles className="size-4" />
              {t("parent", "childrenScreen.openChildApp")}
            </Link>
            <SnowButton variant="ghost" onClick={() => setIsAddChildOpen(true)}>
              <Plus className="mr-2 size-5" />
              {t("parent", "childrenScreen.addChild")}
            </SnowButton>
          </div>
        }
      />

      {/* Add Child Modal Dialog */}
      {isAddChildOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <SnowCard className="w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-snow-border">
              <h3 className="text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.addChildProfile")}</h3>
              <button
                type="button"
                onClick={() => setIsAddChildOpen(false)}
                className="rounded-full p-1 text-snow-muted hover:bg-snow-surface-soft"
                aria-label={t("parent", "childrenScreen.close")}
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddChildSubmit} className="mt-4 space-y-4">
              {addChildError && (
                <div className="rounded-[var(--radius-md)] bg-snow-error-soft p-3 text-xs font-bold text-snow-error">
                  {addChildError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-snow-primary-dark">{t("parent", "childrenScreen.childNameLabel")}</label>
                <input
                  type="text"
                  required
                  value={childNameInput}
                  onChange={(e) => setChildNameInput(e.target.value)}
                  placeholder={t("parent", "childrenScreen.childNamePlaceholder")}
                  className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-snow-primary-dark">{t("parent", "childrenScreen.childPinLabel")}</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={childPinInput}
                  onChange={(e) => setChildPinInput(e.target.value)}
                  placeholder={t("parent", "childrenScreen.childPinPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                />
                <p className="mt-1 text-[11px] text-snow-muted">{t("parent", "childrenScreen.childPinHelp")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">{t("parent", "childrenScreen.ageLabel")}</label>
                  <input
                    type="number"
                    min={3}
                    max={18}
                    value={childAgeInput}
                    onChange={(e) => setChildAgeInput(e.target.value)}
                    placeholder={t("parent", "childrenScreen.agePlaceholder")}
                    className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">{t("parent", "childrenScreen.gradeLabel")}</label>
                  <input
                    type="text"
                    value={childGradeInput}
                    onChange={(e) => setChildGradeInput(e.target.value)}
                    placeholder={t("parent", "childrenScreen.gradePlaceholder")}
                    className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <SnowButton
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddChildOpen(false)}
                  disabled={isSubmittingChild}
                >
                  {t("parent", "childrenScreen.cancel")}
                </SnowButton>
                <SnowButton type="submit" disabled={isSubmittingChild}>
                  {isSubmittingChild ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                  {t("parent", "childrenScreen.createChild")}
                </SnowButton>
              </div>
            </form>
          </SnowCard>
        </div>
      )}

      {children.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={t("parent", "childrenScreen.noChildrenTitle")}
          description={t("parent", "childrenScreen.noChildrenDesc")}
          actionLabel={t("parent", "childrenScreen.addChild")}
          onAction={() => setIsAddChildOpen(true)}
          className="mt-8 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-12"
        />
      ) : (
        <>
          {/* Status Tiles */}
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <StatusTile
              label={t("parent", "childrenScreen.selectedChildLabel")}
              value={selectedChild ? `${selectedChild.name}, ${t("parent", "childrenScreen.ageFormatLower").replace("{age}", String(selectedChild.age ?? t("parent", "childrenScreen.notSetMark")))}` : t("parent", "childrenScreen.none")}
              detail={selectedChild?.grade ?? t("parent", "childrenScreen.gradeNotSet")}
              icon={<Heart className="size-5 text-snow-primary" />}
            />
            <StatusTile
              label={t("parent", "childrenScreen.recentLessonLabel")}
              value={latestAttempt ? latestAttempt.lessonTitle : t("parent", "childrenScreen.noLessonYet")}
              detail={
                latestAttempt
                  ? latestAttempt.status === "completed"
                    ? t("parent", "childrenScreen.completedScoreFormat").replace("{score}", String(latestAttempt.score ?? 100))
                    : t("parent", "childrenScreen.inProgress")
                  : t("parent", "childrenScreen.readyForFirstCheckin")
              }
              icon={<Clock className="size-5 text-snow-primary" />}
              tone="bg-snow-ice"
            />
            <StatusTile
              label={t("parent", "childrenScreen.reviewStatusLabel")}
              value={t("parent", "childrenScreen.itemsFormat").replace("{count}", String(alerts.length))}
              detail={alerts.length === 0 ? t("parent", "childrenScreen.noActiveAlerts") : t("parent", "childrenScreen.requiresParentReview")}
              icon={<Activity className="size-5 text-snow-primary" />}
              tone="bg-snow-lavender"
            />
            <StatusTile
              label={t("parent", "childrenScreen.routineStatusLabel")}
              value={totalRoutineSteps > 0 ? t("parent", "childrenScreen.stepsFormat").replace("{completed}", String(completedRoutineSteps)).replace("{total}", String(totalRoutineSteps)) : t("parent", "childrenScreen.zeroSteps")}
              detail={routines.length > 0 ? t("parent", "childrenScreen.routinesScheduledFormat").replace("{count}", String(routines.length)) : t("parent", "childrenScreen.noRoutinesToday")}
              icon={<ShieldCheck className="size-5 text-snow-primary" />}
              tone="bg-snow-cream"
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              {selectedChild && (
                <SnowCard className="overflow-hidden">
                  <div className="grid gap-5 bg-snow-primary-soft/50 p-5 md:grid-cols-[auto_minmax(0,1fr)]">
                    <div className="relative size-28 overflow-hidden rounded-full border-8 border-snow-surface shadow-[var(--shadow-soft)]">
                      <Image
                        src={selectedChild.avatarUrl || "/images/snow-avatar-v2.png"}
                        alt={selectedChild.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-snow-primary px-3 py-1 text-xs font-black text-white">
                          {t("parent", "childrenScreen.selectedChildBadge")}
                        </span>
                        <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary-dark">
                          {selectedChild.age ? t("parent", "childrenScreen.ageFormat").replace("{age}", String(selectedChild.age)) : t("parent", "childrenScreen.ageNotSet")}
                        </span>
                        {selectedChild.grade && (
                          <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary-dark">
                            {selectedChild.grade}
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-black",
                            selectedChild.isActive
                              ? "bg-snow-success/15 text-snow-success"
                              : "bg-snow-muted/20 text-snow-muted",
                          )}
                        >
                          {selectedChild.isActive ? t("parent", "childrenScreen.statusActive") : t("parent", "childrenScreen.statusInactive")}
                        </span>
                      </div>
                      <h2 className="mt-3 text-[32px] font-black leading-tight text-snow-primary-dark">
                        {selectedChild.name}
                      </h2>
                      <p className="mt-2 max-w-[58ch] text-sm font-semibold leading-6 text-snow-muted">
                        {progress?.lessonsCompleted
                          ? t("parent", "childrenScreen.progressFormat").replace("{completed}", String(progress.lessonsCompleted)).replace("{minutes}", String(progress.practiceTimeMinutes))
                          : t("parent", "childrenScreen.readyToStartFirstLesson")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 md:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                      <p className="text-xs font-black text-snow-muted">{t("parent", "childrenScreen.recentLessonLabel")}</p>
                      <p className="mt-1 truncate text-lg font-black text-snow-primary-dark">
                        {latestAttempt?.lessonTitle ?? t("parent", "childrenScreen.noneYet")}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {latestAttempt?.status ?? t("parent", "childrenScreen.readyToPractice")}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                      <p className="text-xs font-black text-snow-muted">{t("parent", "childrenScreen.routineTodayLabel")}</p>
                      <p className="mt-1 text-lg font-black text-snow-primary-dark">
                        {totalRoutineSteps > 0 ? t("parent", "childrenScreen.doneFormat").replace("{completed}", String(completedRoutineSteps)).replace("{total}", String(totalRoutineSteps)) : t("parent", "childrenScreen.noneSet")}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {t("parent", "childrenScreen.scheduledRoutinesFormat").replace("{count}", String(routines.length))}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                      <p className="text-xs font-black text-snow-muted">{t("parent", "childrenScreen.safetyAlertsLabel")}</p>
                      <p className="mt-1 text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.alertsFormat").replace("{count}", String(alerts.length))}</p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {alerts.length === 0 ? t("parent", "childrenScreen.allClear") : t("parent", "childrenScreen.checkAlertCenter")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-snow-border p-5 sm:grid-cols-3">
                    <Link href={`/parent/children/${selectedChild.id}/timeline`} className="block">
                      <SnowButton variant="soft" className="w-full justify-center">
                        <Activity className="mr-2 size-4" />
                        {t("parent", "childrenScreen.timeline")}
                      </SnowButton>
                    </Link>
                    <Link href={`/parent/children/${selectedChild.id}/sessions`} className="block">
                      <SnowButton variant="soft" className="w-full justify-center">
                        {t("parent", "childrenScreen.sessions")}
                      </SnowButton>
                    </Link>
                    <Link href={`/parent/children/${selectedChild.id}/routines`} className="block">
                      <SnowButton className="w-full justify-center">
                        <CalendarCheck className="mr-2 size-4" />
                        {t("parent", "childrenScreen.routines")}
                      </SnowButton>
                    </Link>
                  </div>
                </SnowCard>
              )}

              {/* Family Roster */}
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.96fr)_minmax(360px,0.72fr)]">
                <SnowCard className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.familyRoster")}</h2>
                      <p className="mt-1 text-sm font-semibold text-snow-muted">
                        {t("parent", "childrenScreen.familyRosterDesc")}
                      </p>
                    </div>
                    <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                      {t("parent", "childrenScreen.registeredFormat").replace("{count}", String(children.length))}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {children.map((child) => {
                      const isSelected = child.id === selectedChildId;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedChildId(child.id)}
                          className={cn(
                            "snow-focus-ring snow-interactive-card overflow-hidden rounded-[var(--radius-lg)] border text-left",
                            isSelected
                              ? "border-snow-primary bg-snow-primary-soft/70"
                              : "border-snow-border bg-snow-surface",
                          )}
                        >
                          <div
                            className={cn(
                              "grid gap-4 p-4 md:grid-cols-[88px_minmax(0,1fr)]",
                              isSelected ? "bg-snow-primary-soft/30" : "bg-snow-surface-soft/70",
                            )}
                          >
                            <div className="relative size-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface shadow-[var(--shadow-soft)]">
                              <Image
                                src={child.avatarUrl || "/images/snow-avatar-v2.png"}
                                alt={child.name}
                                fill
                                sizes="88px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11px] font-black",
                                    isSelected
                                      ? "bg-snow-primary text-white"
                                      : "bg-snow-primary-soft text-snow-primary-dark",
                                  )}
                                >
                                  {isSelected ? t("parent", "childrenScreen.selectedLabel") : t("parent", "childrenScreen.childProfileBadge")}
                                </span>
                                {child.age && (
                                  <span className="rounded-full bg-snow-surface px-2.5 py-1 text-[11px] font-black text-snow-primary-dark">
                                    {t("parent", "childrenScreen.ageFormat").replace("{age}", String(child.age))}
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-3 text-2xl font-black leading-tight text-snow-primary-dark">
                                {child.name}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-snow-muted">
                                {child.grade ?? t("parent", "childrenScreen.noGradeSpecified")}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SnowCard>

                {/* {t("parent", "childrenScreen.snapshotTitle")} */}
                <SnowCard className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.snapshotTitle")}</h2>
                      <p className="mt-1 text-sm font-semibold text-snow-muted">{t("parent", "childrenScreen.snapshotDesc")}</p>
                    </div>
                    <span className="rounded-full bg-snow-cream px-3 py-1 text-xs font-black text-snow-primary-dark">
                      {t("parent", "childrenScreen.today")}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <Clock className="size-3.5 text-snow-primary" />
                        {t("parent", "childrenScreen.latestLessonLabel")}
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark truncate">
                        {latestAttempt?.lessonTitle ?? t("parent", "childrenScreen.readyToBegin")}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {latestAttempt?.status === "completed"
                          ? t("parent", "childrenScreen.completedScoreFormat").replace("{score}", String(latestAttempt.score ?? 100))
                          : t("parent", "childrenScreen.noRecentCompletedLesson")}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <SunMedium className="size-3.5 text-snow-primary" />
                        {t("parent", "childrenScreen.routinesProgressLabel")}
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {totalRoutineSteps > 0 ? t("parent", "childrenScreen.stepsOfFormat").replace("{completed}", String(completedRoutineSteps)).replace("{total}", String(totalRoutineSteps)) : t("parent", "childrenScreen.noneSet")}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {routines.length > 0 ? t("parent", "childrenScreen.dailyRoutineActive") : t("parent", "childrenScreen.addRoutineInSettings")}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <MessageSquare className="size-3.5 text-snow-primary" />
                        {t("parent", "childrenScreen.safetyReviewLabel")}
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {alerts.length > 0 ? t("parent", "childrenScreen.alertsToReviewFormat").replace("{count}", String(alerts.length)) : t("parent", "childrenScreen.noPendingAlerts")}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {t("parent", "childrenScreen.alertsConfidential")}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-cream p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <Star className="size-3.5 text-snow-warning" />
                        {t("parent", "childrenScreen.practiceTimeLabel")}
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {t("parent", "childrenScreen.minutesFormat").replace("{minutes}", String(progress?.practiceTimeMinutes ?? 0))}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {t("parent", "childrenScreen.acrossLessonsFormat").replace("{count}", String(progress?.lessonsCompleted ?? 0))}
                      </p>
                    </div>
                  </div>
                </SnowCard>
              </div>
            </div>

            {/* Sidebar actions */}
            <aside className="space-y-4">
              {selectedChild && (
                <SnowCard className="p-5">
                  <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.parentReviewQueue")}</h2>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        label: t("parent", "childrenScreen.transcriptReview"),
                        detail: t("parent", "childrenScreen.latestConversationsFormat").replace("{name}", selectedChild.name),
                        href: `/parent/children/${selectedChild.id}/transcripts`,
                        icon: MessageSquare,
                      },
                      {
                        label: t("parent", "childrenScreen.routineProgressLabel"),
                        detail:
                          totalRoutineSteps > 0
                            ? t("parent", "childrenScreen.stepsCompleteFormat").replace("{completed}", String(completedRoutineSteps)).replace("{total}", String(totalRoutineSteps))
                            : t("parent", "childrenScreen.configureRoutineSteps"),
                        href: `/parent/children/${selectedChild.id}/routines`,
                        icon: CalendarCheck,
                      },
                      {
                        label: t("parent", "childrenScreen.privacyControls"),
                        detail: t("parent", "childrenScreen.cameraPreviewDesc"),
                        href: "/parent/privacy",
                        icon: ShieldCheck,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="snow-focus-ring snow-interactive-card group flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-snow-primary-dark">{item.label}</span>
                            <span className="mt-1 block text-xs font-semibold text-snow-muted">{item.detail}</span>
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-snow-muted transition group-hover:text-snow-primary" />
                        </Link>
                      );
                    })}
                  </div>
                </SnowCard>
              )}

              <SnowCard className="bg-snow-lavender p-5">
                <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "childrenScreen.privacyStatus")}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                  {t("parent", "childrenScreen.privacyStatusDesc")}
                </p>
              </SnowCard>
            </aside>
          </div>
        </>
      )}
    </ParentPageFrame>
  );
}
