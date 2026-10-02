"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Sparkles, Star, AlertCircle, RefreshCw } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchLessons, type LessonSummary } from "@/lib/learning-client";

const accentBg: Record<string, string> = {
  primary: "bg-snow-primary-soft",
  aqua: "bg-snow-ice",
  peach: "bg-snow-cream",
  pink: "bg-snow-lavender",
  ice: "bg-snow-ice",
};

function getSubjectAccent(subject?: string, fallbackAccent?: string): string {
  if (fallbackAccent && accentBg[fallbackAccent]) {
    return accentBg[fallbackAccent];
  }
  const s = (subject || "").toLowerCase();
  if (s.includes("math") || s.includes("count")) return accentBg.aqua;
  if (s.includes("story") || s.includes("read")) return accentBg.peach;
  if (s.includes("social") || s.includes("feel")) return accentBg.pink;
  return accentBg.primary;
}

function getLessonImage(image?: string, subject?: string): string {
  if (image) return image;
  const s = (subject || "").toLowerCase();
  if (s.includes("math") || s.includes("count")) return "/images/lesson-math.png";
  if (s.includes("story") || s.includes("fox")) return "/images/lesson-story.png";
  if (s.includes("social") || s.includes("friend") || s.includes("feel")) return "/images/lesson-social.png";
  return "/images/lesson-abc.png";
}

export function LessonCatalog() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadLessons = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function executeFetch() {
      try {
        const data = await fetchLessons();
        if (!ignore) {
          setLessons(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Could not load lessons. Please try again.");
          setIsLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const featuredLesson = lessons.length > 0 ? lessons[0] : null;

  return (
    <ChildSessionFrame>
      <PageHeader
        title="Pick one lesson"
        description="Choose a short activity. AgentKid will guide the steps slowly."
        compact
      />

      {isLoading ? (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] bg-snow-surface p-12 text-center shadow-[var(--shadow-card)]">
            <div className="relative size-24 animate-pulse">
              <Image src="/images/snow-mascot-ui.png" alt="" fill sizes="96px" className="object-contain" />
            </div>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">Loading your calm lessons...</p>
            <p className="text-sm font-semibold text-snow-muted">AgentKid is preparing the activities.</p>
          </div>
        </div>
      ) : error ? (
        <div className="py-6">
          <div className="rounded-[var(--radius-xl)] border border-snow-warning/30 bg-snow-cream p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-snow-warning/20 text-snow-primary-dark">
              <AlertCircle className="size-6" />
            </div>
            <h2 className="mt-3 text-lg font-black text-snow-primary-dark">We couldn&apos;t load the lessons</h2>
            <p className="mt-1 text-sm font-semibold text-snow-muted">{error}</p>
            <div className="mt-5 flex justify-center">
              <SnowButton onClick={loadLessons} className="gap-2">
                <RefreshCw className="size-4" />
                Try again
              </SnowButton>
            </div>
          </div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-6">
          <EmptyState
            title="No lessons available yet"
            description="AgentKid will have new lessons ready soon. Talk with AgentKid or check back later."
            actionLabel="Refresh lessons"
            onAction={loadLessons}
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {featuredLesson && (
              <Link href={`/session/lessons/${featuredLesson.id}`} className="group block snow-focus-ring rounded-[var(--radius-lg)]">
                <SnowCard className="overflow-hidden transition-transform duration-200 group-hover:scale-[1.01]">
                  <div className="grid gap-4 bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender p-5 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-snow-primary">Best next start</p>
                      <h2 className="snow-heading mt-2 text-[1.75rem] font-black text-snow-primary-dark">
                        {featuredLesson.title}
                      </h2>
                      <p className="snow-body-copy snow-font-readable mt-2 max-w-[520px] font-semibold text-snow-muted">
                        {featuredLesson.subtitle || featuredLesson.description || "A calm learning adventure with AgentKid."}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-snow-primary px-4 py-2 text-xs font-black text-white shadow-sm">
                        Start lesson
                      </div>
                    </div>
                    <div className={`relative h-36 rounded-[var(--radius-lg)] ${getSubjectAccent(featuredLesson.subject, featuredLesson.accent)}`}>
                      <Image
                        src={getLessonImage(featuredLesson.image, featuredLesson.subject)}
                        alt={featuredLesson.title}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  </div>
                </SnowCard>
              </Link>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 snow-enter-soft">
              {lessons.map((lesson) => {
                const accentClass = getSubjectAccent(lesson.subject, lesson.accent);
                const lessonImg = getLessonImage(lesson.image, lesson.subject);
                const progressValue = typeof lesson.progress === "number" ? lesson.progress : 0;

                return (
                  <Link
                    key={lesson.id}
                    href={`/session/lessons/${lesson.id}`}
                    className="group snow-focus-ring rounded-[var(--radius-lg)]"
                  >
                    <SnowCard className="snow-interactive-card h-full overflow-hidden">
                      <div className={`relative h-40 ${accentClass} p-4`}>
                        <Image
                          src={lessonImg}
                          alt={lesson.title}
                          fill
                          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                          <BookOpen className="size-3.5" />
                          {lesson.subject}
                        </div>
                        <h2 className="text-lg font-black leading-tight text-snow-primary-dark">{lesson.title}</h2>
                        <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted line-clamp-2">
                          {lesson.subtitle || lesson.description || "Gentle step-by-step practice."}
                        </p>
                        {progressValue > 0 ? (
                          <div className="mt-4">
                            <ProgressStrip value={progressValue} />
                            <p className="mt-2 text-xs font-black text-snow-primary">{progressValue}% completed</p>
                          </div>
                        ) : (
                          <div className="mt-4 text-xs font-black text-snow-muted">Not started yet</div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-xs font-bold text-snow-muted">
                          <span className="flex items-center gap-1">
                            <Star className="size-3.5 text-snow-warning" /> {lesson.rating || "4.8"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : "10 min"}
                          </span>
                        </div>
                      </div>
                    </SnowCard>
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <SnowCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-snow-primary">Best next flow</p>
                    <h2 className="mt-1 text-lg font-black text-snow-primary-dark">Keep one short lesson visible</h2>
                  </div>
                  <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                    Child-safe
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Talk with AgentKid", "A calm opening first."],
                    ["Pick one card", "One lesson is enough."],
                    ["Finish gently", "Return to routine after."],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                      <p className="text-sm font-black text-snow-primary-dark">{title}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">{detail}</p>
                    </div>
                  ))}
                </div>
              </SnowCard>

              <div className="rounded-[var(--radius-xl)] bg-snow-lavender p-5">
                <Sparkles className="size-6 text-snow-primary" />
                <p className="mt-4 text-lg font-black text-snow-primary-dark">AgentKid keeps choices small</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                  Short lessons feel better when they read like invitations, not a giant catalog.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <SnowCard className="p-5">
              <p className="text-xs font-black text-snow-primary">Lesson rhythm</p>
              <p className="mt-2 text-lg font-black text-snow-primary-dark">One short activity is enough for this step.</p>
              <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
                The child flow stays calm when lessons feel like invitations, not a big content catalog.
              </p>
            </SnowCard>
            <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
              <p className="text-sm font-black text-snow-primary-dark">Good pairing</p>
              <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
                Talk with AgentKid first, then open one lesson that matches the day&apos;s energy.
              </p>
            </div>
          </aside>
        </div>
      )}
    </ChildSessionFrame>
  );
}
