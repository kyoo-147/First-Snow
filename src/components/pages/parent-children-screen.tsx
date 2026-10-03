"use client";

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
      setAddChildError("Please provide a child name.");
      return;
    }

    const trimmedPin = childPinInput.trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      setAddChildError("PIN must be exactly 4 digits.");
      return;
    }

    const ageNum = childAgeInput.trim() ? parseInt(childAgeInput.trim(), 10) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 3 || ageNum > 18)) {
      setAddChildError("Age must be between 3 and 18.");
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
          <p className="mt-4 text-sm font-bold text-snow-muted">Loading children roster...</p>
        </div>
      </ParentPageFrame>
    );
  }

  if (error && children.length === 0) {
    return (
      <ParentPageFrame>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="size-10 text-snow-error" />
          <h2 className="mt-3 text-lg font-black text-snow-primary-dark">Unable to load children</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          <SnowButton variant="soft" onClick={reload} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try again
          </SnowButton>
        </div>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow="Parent portal"
        title="My children"
        description="Select a child to review sessions, learning progress, routines, and parent-only safety settings."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/session/home"
              className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary px-5 text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition hover:brightness-105"
            >
              <Sparkles className="size-4" />
              Open child app
            </Link>
            <SnowButton variant="ghost" onClick={() => setIsAddChildOpen(true)}>
              <Plus className="mr-2 size-5" />
              Add child
            </SnowButton>
          </div>
        }
      />

      {/* Add Child Modal Dialog */}
      {isAddChildOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <SnowCard className="w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-snow-border">
              <h3 className="text-lg font-black text-snow-primary-dark">Add a child profile</h3>
              <button
                type="button"
                onClick={() => setIsAddChildOpen(false)}
                className="rounded-full p-1 text-snow-muted hover:bg-snow-surface-soft"
                aria-label="Close"
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
                <label className="block text-xs font-black text-snow-primary-dark">Child name *</label>
                <input
                  type="text"
                  required
                  value={childNameInput}
                  onChange={(e) => setChildNameInput(e.target.value)}
                  placeholder="e.g. Avery"
                  className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-snow-primary-dark">Child 4-digit PIN *</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={childPinInput}
                  onChange={(e) => setChildPinInput(e.target.value)}
                  placeholder="4 digits"
                  className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                />
                <p className="mt-1 text-[11px] text-snow-muted">Used by child to log in on child surfaces.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">Age (optional)</label>
                  <input
                    type="number"
                    min={3}
                    max={18}
                    value={childAgeInput}
                    onChange={(e) => setChildAgeInput(e.target.value)}
                    placeholder="e.g. 7"
                    className="mt-1 w-full rounded-lg border border-snow-border px-3 py-2 text-sm text-snow-primary-dark placeholder:text-snow-muted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">Grade (optional)</label>
                  <input
                    type="text"
                    value={childGradeInput}
                    onChange={(e) => setChildGradeInput(e.target.value)}
                    placeholder="e.g. 2nd Grade"
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
                  Cancel
                </SnowButton>
                <SnowButton type="submit" disabled={isSubmittingChild}>
                  {isSubmittingChild ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                  Create child
                </SnowButton>
              </div>
            </form>
          </SnowCard>
        </div>
      )}

      {children.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No children registered yet"
          description="Create your first child profile to begin assigning routines and tracking practice progress."
          actionLabel="Add child"
          onAction={() => setIsAddChildOpen(true)}
          className="mt-8 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-12"
        />
      ) : (
        <>
          {/* Status Tiles */}
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <StatusTile
              label="Selected child"
              value={selectedChild ? `${selectedChild.name}, age ${selectedChild.age ?? "—"}` : "None"}
              detail={selectedChild?.grade ?? "Grade not set"}
              icon={<Heart className="size-5 text-snow-primary" />}
            />
            <StatusTile
              label="Recent lesson"
              value={latestAttempt ? latestAttempt.lessonTitle : "No lesson yet"}
              detail={
                latestAttempt
                  ? latestAttempt.status === "completed"
                    ? `Completed (Score: ${latestAttempt.score ?? 100}%)`
                    : "In progress"
                  : "Ready for first check-in"
              }
              icon={<Clock className="size-5 text-snow-primary" />}
              tone="bg-snow-ice"
            />
            <StatusTile
              label="Review status"
              value={`${alerts.length} item(s)`}
              detail={alerts.length === 0 ? "No active alerts" : "Requires parent review"}
              icon={<Activity className="size-5 text-snow-primary" />}
              tone="bg-snow-lavender"
            />
            <StatusTile
              label="Routine status"
              value={totalRoutineSteps > 0 ? `${completedRoutineSteps} / ${totalRoutineSteps} steps` : "0 steps"}
              detail={routines.length > 0 ? `${routines.length} routine(s) scheduled` : "No routines today"}
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
                        src={selectedChild.avatarUrl || "/images/snow-avatar-final.png"}
                        alt={selectedChild.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-snow-primary px-3 py-1 text-xs font-black text-white">
                          Selected child
                        </span>
                        <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary-dark">
                          {selectedChild.age ? `Age ${selectedChild.age}` : "Age not set"}
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
                          {selectedChild.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <h2 className="mt-3 text-[32px] font-black leading-tight text-snow-primary-dark">
                        {selectedChild.name}
                      </h2>
                      <p className="mt-2 max-w-[58ch] text-sm font-semibold leading-6 text-snow-muted">
                        {progress?.lessonsCompleted
                          ? `${progress.lessonsCompleted} lesson(s) completed with ${progress.practiceTimeMinutes} total minutes practiced.`
                          : "Ready to start first lesson practice session."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 md:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                      <p className="text-xs font-black text-snow-muted">Recent lesson</p>
                      <p className="mt-1 truncate text-lg font-black text-snow-primary-dark">
                        {latestAttempt?.lessonTitle ?? "None yet"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {latestAttempt?.status ?? "Ready to practice"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                      <p className="text-xs font-black text-snow-muted">Routine today</p>
                      <p className="mt-1 text-lg font-black text-snow-primary-dark">
                        {totalRoutineSteps > 0 ? `${completedRoutineSteps}/${totalRoutineSteps} done` : "None set"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {routines.length} scheduled routine(s)
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                      <p className="text-xs font-black text-snow-muted">Safety alerts</p>
                      <p className="mt-1 text-lg font-black text-snow-primary-dark">{alerts.length} alert(s)</p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {alerts.length === 0 ? "All clear" : "Check alert center"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-snow-border p-5 sm:grid-cols-3">
                    <Link href={`/parent/children/${selectedChild.id}/timeline`} className="block">
                      <SnowButton variant="soft" className="w-full justify-center">
                        <Activity className="mr-2 size-4" />
                        Timeline
                      </SnowButton>
                    </Link>
                    <Link href={`/parent/children/${selectedChild.id}/sessions`} className="block">
                      <SnowButton variant="soft" className="w-full justify-center">
                        Sessions
                      </SnowButton>
                    </Link>
                    <Link href={`/parent/children/${selectedChild.id}/routines`} className="block">
                      <SnowButton className="w-full justify-center">
                        <CalendarCheck className="mr-2 size-4" />
                        Routines
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
                      <h2 className="text-lg font-black text-snow-primary-dark">Family roster</h2>
                      <p className="mt-1 text-sm font-semibold text-snow-muted">
                        Switch between child profiles without leaving the parent portal.
                      </p>
                    </div>
                    <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                      {children.length} registered
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
                                src={child.avatarUrl || "/images/snow-avatar-final.png"}
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
                                  {isSelected ? "Selected" : "Child profile"}
                                </span>
                                {child.age && (
                                  <span className="rounded-full bg-snow-surface px-2.5 py-1 text-[11px] font-black text-snow-primary-dark">
                                    Age {child.age}
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-3 text-2xl font-black leading-tight text-snow-primary-dark">
                                {child.name}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-snow-muted">
                                {child.grade ?? "No grade specified"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SnowCard>

                {/* Selected child snapshot */}
                <SnowCard className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-snow-primary-dark">Selected child snapshot</h2>
                      <p className="mt-1 text-sm font-semibold text-snow-muted">A quick surface for next parent actions.</p>
                    </div>
                    <span className="rounded-full bg-snow-cream px-3 py-1 text-xs font-black text-snow-primary-dark">
                      Today
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <Clock className="size-3.5 text-snow-primary" />
                        Latest lesson
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark truncate">
                        {latestAttempt?.lessonTitle ?? "Ready to begin"}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {latestAttempt?.status === "completed"
                          ? `Completed (Score: ${latestAttempt.score ?? 100}%)`
                          : "No recent completed lesson"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <SunMedium className="size-3.5 text-snow-primary" />
                        Routines progress
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {totalRoutineSteps > 0 ? `${completedRoutineSteps} of ${totalRoutineSteps} steps` : "None set"}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        {routines.length > 0 ? "Daily routine active" : "Add routine in settings"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <MessageSquare className="size-3.5 text-snow-primary" />
                        Safety review
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {alerts.length > 0 ? `${alerts.length} alert(s) to review` : "No pending alerts"}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        Parent alerts remain strictly confidential.
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-snow-cream p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                        <Star className="size-3.5 text-snow-warning" />
                        Practice time
                      </p>
                      <p className="mt-2 text-lg font-black text-snow-primary-dark">
                        {progress?.practiceTimeMinutes ?? 0} minutes
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                        Across {progress?.lessonsCompleted ?? 0} completed lesson(s)
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
                  <h2 className="text-lg font-black text-snow-primary-dark">Parent review queue</h2>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        label: "Transcript review",
                        detail: `Latest conversations with ${selectedChild.name}`,
                        href: `/parent/children/${selectedChild.id}/transcripts`,
                        icon: MessageSquare,
                      },
                      {
                        label: "Routine progress",
                        detail:
                          totalRoutineSteps > 0
                            ? `${completedRoutineSteps} of ${totalRoutineSteps} steps complete`
                            : "Configure routine steps",
                        href: `/parent/children/${selectedChild.id}/routines`,
                        icon: CalendarCheck,
                      },
                      {
                        label: "Privacy & controls",
                        detail: "Camera preview stays off by default",
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
                <h2 className="text-lg font-black text-snow-primary-dark">Privacy status</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">
                  Camera preview is off by default. Emergency alert settings and safety transcripts are strictly parent-only.
                </p>
              </SnowCard>
            </aside>
          </div>
        </>
      )}
    </ParentPageFrame>
  );
}
