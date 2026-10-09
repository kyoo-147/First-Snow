"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Volume2,
  Star,
} from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  fetchLesson,
  createOrResumeAttempt,
  saveAttemptAnswer,
  completeAttempt,
  type LessonDetail,
  type LessonAttempt,
  type LessonStep,
} from "@/lib/learning-client";
import { t } from "@/i18n";

interface InteractiveLessonRunnerProps {
  lessonId: string;
}

export function InteractiveLessonRunner({ lessonId }: InteractiveLessonRunnerProps) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [attempt, setAttempt] = useState<LessonAttempt | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const initLesson = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    let ignore = false;

    async function load() {
      try {
        const [lessonData, attemptData] = await Promise.all([
          fetchLesson(lessonId),
          createOrResumeAttempt(lessonId),
        ]);
        if (!ignore) {
          setLesson(lessonData);
          setAttempt(attemptData);

          const existingAnswers = attemptData.answers || {};
          setAnswers(existingAnswers);

          // Find first incomplete step if resuming
          if (lessonData.steps && lessonData.steps.length > 0) {
            const firstUnansweredIndex = lessonData.steps.findIndex(
              (step) => existingAnswers[step.id] === undefined
            );
            if (firstUnansweredIndex > 0) {
              setCurrentStepIndex(firstUnansweredIndex);
            }
          }
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : t("learning", "runner.failedToLoad")
          );
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [lessonId, reloadKey]);

  const currentStep: LessonStep | undefined = lesson?.steps[currentStepIndex];
  const currentAnswer = currentStep ? answers[currentStep.id] : undefined;
  const isLastStep = lesson ? currentStepIndex === lesson.steps.length - 1 : false;
  const isCompleted = attempt?.status === "completed";

  const [showHint, setShowHint] = useState(false);
  const [lastGrading, setLastGrading] = useState<{
    isCorrect: boolean;
    score: number;
    explanation?: string;
    hint?: string;
    validationError?: string;
  } | null>(null);

  const handleUpdateAnswer = async (newVal: unknown) => {
    if (!currentStep || !attempt || isCompleted) return;

    const newAnswers = { ...answers, [currentStep.id]: newVal };
    setAnswers(newAnswers);
    setIsChecked(false);
    setSaveStatus("saving");

    try {
      const updated = await saveAttemptAnswer(attempt.id, currentStep.id, newVal);
      setAttempt(updated);
      if (updated.grading) {
        setLastGrading(updated.grading);
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const handleSelectOption = (optionId: string) => {
    handleUpdateAnswer(optionId);
  };

  const handleToggleMultiSelect = (optionId: string) => {
    const currentList = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
    const exists = currentList.includes(optionId);
    const updated = exists ? currentList.filter((id) => id !== optionId) : [...currentList, optionId];
    handleUpdateAnswer(updated);
  };

  const handleMoveOrderItem = (index: number, direction: "up" | "down") => {
    const defaultList = options.map((o) => o.id);
    const list = Array.isArray(currentAnswer) && currentAnswer.length === defaultList.length
      ? [...(currentAnswer as string[])]
      : [...defaultList];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    handleUpdateAnswer(list);
  };

  const handleRetrySave = async () => {
    if (!currentStep || !attempt || currentAnswer === undefined) return;
    setSaveStatus("saving");
    try {
      const updated = await saveAttemptAnswer(attempt.id, currentStep.id, currentAnswer);
      setAttempt(updated);
      if (updated.grading) {
        setLastGrading(updated.grading);
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const handleNextStep = () => {
    if (!lesson) return;
    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setIsChecked(false);
      setShowHint(false);
      setLastGrading(null);
      setSaveStatus("idle");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsChecked(false);
      setShowHint(false);
      setLastGrading(null);
      setSaveStatus("idle");
    }
  };

  const handleComplete = async () => {
    if (!attempt) return;
    setIsCompleting(true);
    setError(null);
    try {
      const finished = await completeAttempt(attempt.id);
      setAttempt(finished);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t("learning", "runner.failedToComplete")
      );
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 py-12 snow-enter-soft">
        <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] bg-snow-surface p-12 text-center shadow-[var(--shadow-card)]">
          <div className="relative size-28 animate-pulse">
            <Image src="/images/snow-mascot-v2.png" alt="" aria-hidden="true" fill sizes="112px" className="object-contain" />
          </div>
          <h2 className="text-xl font-black text-snow-primary-dark">{t("learning", "runner.loading")}</h2>
          <p className="max-w-[420px] text-sm font-semibold text-snow-muted">
            {t("learning", "runner.loadingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 py-8 snow-enter-soft">
        <Link href="/session/lessons" className="inline-flex items-center gap-2 text-sm font-black text-snow-primary">
          <ArrowLeft className="size-4" />
          {t("learning", "runner.backToLessons")}
        </Link>
        <div className="rounded-[var(--radius-xl)] border border-snow-warning/30 bg-snow-cream p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-snow-warning/20 text-snow-primary-dark">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="mt-3 text-xl font-black text-snow-primary-dark">{t("learning", "runner.unableToStart")}</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <SnowButton onClick={initLesson} className="gap-2">
              <RefreshCw className="size-4" />
              {t("learning", "runner.tryAgain")}
            </SnowButton>
            <Link href="/session/lessons">
              <SnowButton variant="ghost">{t("learning", "runner.returnToCatalog")}</SnowButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 py-8 snow-enter-soft">
        <Link href="/session/lessons" className="inline-flex items-center gap-2 text-sm font-black text-snow-primary">
          <ArrowLeft className="size-4" />
          {t("learning", "runner.backToLessons")}
        </Link>
        <EmptyState
          title={t("learning", "runner.stepsNotAvailable")}
          description={t("learning", "runner.stepsNotAvailableDesc")}
          actionLabel={t("learning", "runner.returnToLessons")}
          onAction={() => {
            window.location.href = "/session/lessons";
          }}
        />
      </div>
    );
  }

  // Completion view
  if (isCompleted) {
    const hasServerScore =
      typeof attempt?.score === "number" && !Number.isNaN(attempt.score);

    return (
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6 py-8 snow-enter-soft">
        <div className="rounded-[var(--radius-2xl)] bg-gradient-to-b from-snow-surface via-snow-surface to-snow-primary-soft/30 p-8 text-center shadow-[var(--shadow-card)]">
          <div className="relative mx-auto size-36 snow-float-soft">
            <Image src="/images/snow-mascot-v2.png" alt="Linh vật Snow" fill sizes="144px" className="object-contain" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-snow-success/15 px-4 py-1.5 text-sm font-black text-snow-success">
            <CheckCircle2 className="size-4" />
            {t("learning", "runner.completedBadge")}
          </div>

          <h1 className="snow-heading mt-4 text-[2rem] font-black text-snow-primary-dark">
            {t("learning", "runner.completedTitle", { title: lesson.title })}
          </h1>
          <p className="snow-body-copy snow-font-readable mx-auto mt-2 max-w-[500px] font-semibold text-snow-muted">
            {t("learning", "runner.completedDesc")}
          </p>

          <div className="mx-auto mt-6 flex max-w-[320px] items-center justify-around rounded-[var(--radius-lg)] bg-snow-surface-soft p-4">
            {hasServerScore ? (
              <>
                <div className="text-center">
                  <p className="text-xs font-black uppercase text-snow-muted">{t("learning", "runner.scoreLabel")}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-black text-snow-primary-dark">
                    <Star className="size-5 text-snow-warning fill-snow-warning" />
                    {attempt?.score}%
                  </p>
                </div>
                <div className="h-8 w-px bg-snow-border" />
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs font-black uppercase text-snow-muted">{t("learning", "runner.statusLabel")}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-base font-black text-snow-primary-dark">
                    <CheckCircle2 className="size-4 text-snow-success" />
                    {t("learning", "lesson.status.completed")}
                  </p>
                </div>
                <div className="h-8 w-px bg-snow-border" />
              </>
            )}
            <div className="text-center">
              <p className="text-xs font-black uppercase text-snow-muted">{t("learning", "runner.stepsLabel")}</p>
              <p className="mt-1 text-2xl font-black text-snow-primary-dark">{lesson.steps.length}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/session/lessons">
              <SnowButton className="px-8 text-base">{t("learning", "runner.backToLessons")}</SnowButton>
            </Link>
            <SnowButton
              variant="soft"
              onClick={() => {
                setCurrentStepIndex(0);
                setIsChecked(false);
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              {t("learning", "runner.reviewSteps")}
            </SnowButton>
          </div>
        </div>
      </div>
    );
  }

  const options = Array.isArray(currentStep?.options) ? currentStep.options : [];
  const hasOptions = options.length > 0;
  const selectedOption = options.find((opt) => opt.id === currentAnswer);

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 pb-8 snow-enter-soft">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/session/lessons" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-snow-primary">
            <ArrowLeft className="size-4" />
            {t("learning", "runner.backToLessons")}
          </Link>
          <p className="text-xs font-black uppercase tracking-wide text-snow-primary">{lesson.subject}</p>
          <h1 className="mt-1 text-[30px] font-black leading-tight text-snow-primary-dark md:text-[36px]">
            {lesson.title}
          </h1>
          <p className="mt-2 max-w-[620px] text-sm font-semibold leading-6 text-snow-muted md:text-base">
            {lesson.subtitle || currentStep?.instruction || t("learning", "runner.defaultQuestion")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs font-bold text-snow-muted animate-pulse">{t("learning", "runner.saving")}</span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 text-xs font-black text-snow-success">
              <Check className="size-3" /> {t("learning", "runner.saved")}
            </span>
          )}
          {saveStatus === "error" && (
            <button
              onClick={handleRetrySave}
              className="inline-flex items-center gap-1 text-xs font-black text-snow-warning underline"
            >
              <AlertCircle className="size-3" /> {t("learning", "runner.retrySave")}
            </button>
          )}
          <div className="rounded-full bg-snow-primary-soft px-4 py-2 text-xs font-black text-snow-primary">
            {t("learning", "runner.stepCount", { current: currentStepIndex + 1, total: lesson.steps.length })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-snow-warning/30 bg-snow-cream p-4 text-sm font-semibold text-snow-primary-dark flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-snow-warning" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold text-snow-muted hover:text-snow-primary-dark"
          >
            {t("learning", "runner.dismiss")}
          </button>
        </div>
      )}

      {/* Main Interactive Grid */}
      <section className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left Mascot Rail */}
        <aside className="space-y-4">
          <div className="rounded-[var(--radius-xl)] bg-snow-ice p-5">
            <div className="relative mx-auto size-36 snow-float-soft">
              <Image src="/images/snow-mascot-v2.png" alt="Linh vật Snow" fill sizes="128px" className="object-contain" />
            </div>
            <div className="mt-4 rounded-[var(--radius-lg)] bg-snow-surface p-4">
              <p className="text-sm font-black text-snow-primary-dark">{t("learning", "runner.agentKidSays")}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                {currentStep?.helper || t("learning", "runner.defaultHelper")}
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <p className="text-sm font-black text-snow-primary-dark">{t("learning", "runner.pacingReminder")}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
              {t("learning", "runner.pacingDesc")}
            </p>
          </div>
        </aside>

        {/* Center Activity Card */}
        <SnowCard className="overflow-hidden">
          <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Step Prompt & Visual */}
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={t("learning", "runner.audioPromptAria")}
                  className="snow-interactive-card snow-focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary"
                >
                  <Volume2 className="size-5" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-snow-primary-dark">
                    {currentStep?.prompt || currentStep?.title || t("learning", "runner.chooseAnswer")}
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">
                    {currentStep?.instruction || t("learning", "runner.selectCard")}
                  </p>
                </div>
              </div>

              <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] bg-snow-surface-soft">
                <Image
                  src={currentStep?.image || lesson.image || "/images/lesson-story.png"}
                  alt={currentStep?.title || t("learning", "runner.illustrationAlt")}
                  fill
                  sizes="720px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Choices & Actions */}
            <div className="space-y-3">
              {/* Question Type specific interaction */}
              {(() => {
                const qType = currentStep?.questionType || (hasOptions ? "single_choice" : "unsupported");

                if (qType === "single_choice") {
                  if (!hasOptions) {
                    return (
                      <div className="rounded-[var(--radius-lg)] border border-dashed border-snow-border bg-snow-surface-soft p-6 text-center">
                        <p className="text-base font-black text-snow-primary-dark">{t("learning", "runner.choicesUnavailable")}</p>
                        <p className="mt-1 text-sm font-semibold text-snow-muted">{t("learning", "runner.choicesUnavailableDesc")}</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3" role="radiogroup" aria-label={currentStep?.prompt || "Single choice"}>
                      {options.map((opt) => {
                        const isSelected = currentAnswer === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectOption(opt.id)}
                            className={cn(
                              "snow-interactive-card snow-focus-ring flex min-h-[84px] w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all",
                              isSelected
                                ? "border-snow-primary bg-snow-primary-soft shadow-sm ring-2 ring-snow-primary/30"
                                : "border-snow-border bg-snow-surface-soft hover:bg-snow-surface"
                            )}
                          >
                            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full font-black text-snow-primary-dark", opt.tone || "bg-snow-cream")}>
                              <Sparkles className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-black text-snow-primary-dark">{opt.label}</span>
                              {opt.helper && <span className="mt-0.5 block text-xs font-semibold text-snow-muted">{opt.helper}</span>}
                            </span>
                            {isSelected && <Check className="size-5 shrink-0 text-snow-primary snow-pop-soft" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (qType === "multiple_choice") {
                  const selectedIds = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
                  return (
                    <div className="space-y-3" role="group" aria-label={currentStep?.prompt || "Multiple choice"}>
                      {options.map((opt) => {
                        const isSelected = selectedIds.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            onClick={() => handleToggleMultiSelect(opt.id)}
                            className={cn(
                              "snow-interactive-card snow-focus-ring flex min-h-[84px] w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all",
                              isSelected
                                ? "border-snow-primary bg-snow-primary-soft shadow-sm ring-2 ring-snow-primary/30"
                                : "border-snow-border bg-snow-surface-soft hover:bg-snow-surface"
                            )}
                          >
                            <div className={cn("grid size-6 shrink-0 place-items-center rounded border transition-colors", isSelected ? "border-snow-primary bg-snow-primary text-white" : "border-snow-border bg-white")}>
                              {isSelected && <Check className="size-4" />}
                            </div>
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-black text-snow-primary-dark">{opt.label}</span>
                              {opt.helper && <span className="mt-0.5 block text-xs font-semibold text-snow-muted">{opt.helper}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (qType === "ordering") {
                  const defaultList = options.map((o) => o.id);
                  const currentOrder = Array.isArray(currentAnswer) && currentAnswer.length === defaultList.length
                    ? (currentAnswer as string[])
                    : defaultList;

                  return (
                    <div className="space-y-2.5" role="list" aria-label="Ordering list">
                      {currentOrder.map((optId, idx) => {
                        const opt = options.find((o) => o.id === optId);
                        if (!opt) return null;
                        return (
                          <div
                            key={optId}
                            role="listitem"
                            className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface-soft p-3.5 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-snow-primary-soft text-xs font-black text-snow-primary">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-black text-snow-primary-dark truncate">{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                aria-label={`${t("learning", "runner.moveUp")} ${idx + 1}`}
                                disabled={idx === 0}
                                onClick={() => handleMoveOrderItem(idx, "up")}
                                className={cn("grid size-8 place-items-center rounded-md border border-snow-border bg-snow-surface hover:bg-snow-cream", idx === 0 && "opacity-30 cursor-not-allowed")}
                              >
                                <ArrowUp className="size-4 text-snow-primary" />
                              </button>
                              <button
                                type="button"
                                aria-label={`${t("learning", "runner.moveDown")} ${idx + 1}`}
                                disabled={idx === currentOrder.length - 1}
                                onClick={() => handleMoveOrderItem(idx, "down")}
                                className={cn("grid size-8 place-items-center rounded-md border border-snow-border bg-snow-surface hover:bg-snow-cream", idx === currentOrder.length - 1 && "opacity-30 cursor-not-allowed")}
                              >
                                <ArrowDown className="size-4 text-snow-primary" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (qType === "true_false") {
                  return (
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={currentStep?.prompt || "True False"}>
                      {[true, false].map((val) => {
                        const isSelected = currentAnswer === val;
                        return (
                          <button
                            key={String(val)}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleUpdateAnswer(val)}
                            className={cn(
                              "snow-interactive-card snow-focus-ring flex min-h-[90px] flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border p-4 text-center transition-all",
                              isSelected
                                ? "border-snow-primary bg-snow-primary-soft shadow-sm ring-2 ring-snow-primary/30"
                                : "border-snow-border bg-snow-surface-soft hover:bg-snow-surface"
                            )}
                          >
                            <span className="text-lg font-black text-snow-primary-dark">
                              {val ? t("learning", "runner.trueLabel") : t("learning", "runner.falseLabel")}
                            </span>
                            {isSelected && <Check className="size-4 text-snow-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (qType === "fill_blank" || qType === "short_answer") {
                  const textVal = typeof currentAnswer === "string" ? currentAnswer : "";
                  return (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={textVal}
                        onChange={(e) => handleUpdateAnswer(e.target.value)}
                        placeholder={t("learning", "runner.inputPlaceholder")}
                        className="w-full rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-4 text-base font-bold text-snow-primary-dark placeholder:text-snow-muted focus:border-snow-primary focus:outline-none focus:ring-2 focus:ring-snow-primary/20"
                      />
                    </div>
                  );
                }

                return null;
              })()}

              {/* Action: Check Answer */}
              <div className="pt-2">
                <SnowButton
                  disabled={currentAnswer === undefined || currentAnswer === ""}
                  className={cn("w-full justify-center", (currentAnswer === undefined || currentAnswer === "") && "pointer-events-none opacity-55")}
                  onClick={() => setIsChecked(true)}
                >
                  {t("learning", "runner.checkAnswer")}
                </SnowButton>
              </div>

              {/* Feedback and Explanations */}
              {isChecked && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "rounded-[var(--radius-md)] border p-4 text-sm font-semibold leading-6 snow-pop-soft",
                    lastGrading?.isCorrect
                      ? "border-snow-success/40 bg-snow-success/15 text-snow-primary-dark"
                      : "border-snow-warning/40 bg-snow-cream text-snow-primary-dark"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {lastGrading?.isCorrect ? (
                      <>
                        <CheckCircle2 className="size-5 text-snow-success shrink-0" aria-hidden="true" />
                        <span className="font-black text-snow-success inline-flex items-center gap-1.5">
                          [{t("learning", "runner.statusCorrectBadge")}] {t("learning", "runner.feedbackCorrect")}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-5 text-snow-warning shrink-0" aria-hidden="true" />
                        <span className="font-black text-snow-primary-dark inline-flex items-center gap-1.5">
                          [{t("learning", "runner.statusIncorrectBadge")}] {t("learning", "runner.feedbackIncorrect")}
                        </span>
                      </>
                    )}
                  </div>

                  {(currentStep?.explanation || lastGrading?.explanation) && (
                    <div className="mt-2.5 pt-2.5 border-t border-snow-border/50 text-xs font-medium text-snow-primary-dark">
                      <p className="font-bold uppercase tracking-wider text-snow-muted mb-0.5">{t("learning", "runner.feedbackExplanation")}:</p>
                      <p>{currentStep?.explanation || lastGrading?.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Hint toggle if authored */}
              {currentStep?.hint && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowHint((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-snow-primary hover:underline"
                  >
                    <HelpCircle className="size-3.5" />
                    {showHint ? "Ẩn gợi ý" : t("learning", "runner.hintLabel")}
                  </button>
                  {showHint && (
                    <div className="mt-2 rounded-[var(--radius-md)] bg-snow-surface-soft border border-snow-border p-3 text-xs font-semibold text-snow-muted">
                      {currentStep.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Step Navigation Bar */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                <SnowButton
                  type="button"
                  variant="ghost"
                  disabled={currentStepIndex === 0}
                  onClick={handlePrevStep}
                  className={cn(currentStepIndex === 0 && "opacity-40")}
                >
                  <ArrowLeft className="mr-1 size-4" />
                  {t("learning", "runner.previous")}
                </SnowButton>

                {isLastStep ? (
                  <SnowButton
                    type="button"
                    disabled={hasOptions ? !currentAnswer || isCompleting : isCompleting}
                    onClick={handleComplete}
                    className="gap-2"
                  >
                    {isCompleting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        {t("learning", "runner.finishing")}
                      </>
                    ) : (
                      <>
                        {t("learning", "runner.finish")}
                        <CheckCircle2 className="size-4" />
                      </>
                    )}
                  </SnowButton>
                ) : (
                  <SnowButton
                    type="button"
                    disabled={hasOptions ? !currentAnswer : false}
                    onClick={handleNextStep}
                    className="gap-2"
                  >
                    {t("learning", "runner.next")}
                    <ArrowRight className="size-4" />
                  </SnowButton>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Audio & Controls Strip */}
          <div className="border-t border-snow-border bg-snow-surface-soft/70 px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <SnowButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsChecked(false);
                  }}
                >
                  <RotateCcw className="size-4 mr-1.5" />
                  {t("learning", "runner.repeatPrompt")}
                </SnowButton>
                <SnowButton type="button" variant="ghost">
                  <Volume2 className="size-4 mr-1.5" />
                  {t("learning", "runner.playAudio")}
                </SnowButton>
              </div>
              <div className="rounded-full bg-snow-primary px-6 py-2.5 text-sm font-black text-white shadow-[var(--shadow-card)]">
                {t("learning", "runner.holdToTalk")}
              </div>
            </div>
          </div>
        </SnowCard>
      </section>
    </div>
  );
}
