"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Heart,
  Loader2,
  RefreshCw,
  Sparkles,
  Stars,
} from "lucide-react";
import { ChildSessionFrame } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import {
  fetchDashboardLessons,
  fetchDashboardRoutines,
  fetchDashboardSession,
  fetchHouseholdChildren,
  getErrorMessage,
  localDateKey,
  type AuthSession,
  type DashboardLesson,
  type DashboardRoutine,
} from "@/lib/dashboard-client";

export function HomeScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [childName, setChildName] = useState<string>("there");
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [routines, setRoutines] = useState<DashboardRoutine[]>([]);
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
        const auth = await fetchDashboardSession();
        if (ignore) return;
        setSession(auth);

        let activeChildId: string | null = null;
        if (auth?.actorType === "child") {
          setChildName(auth.child.name);
          activeChildId = auth.child.id;
        } else if (auth?.actorType === "parent" || auth?.actorType === "admin") {
          const householdChildren = await fetchHouseholdChildren().catch(() => []);
          if (householdChildren.length > 0) {
            setChildName(householdChildren[0].name);
            activeChildId = householdChildren[0].id;
          } else {
            setChildName(auth.user.name || "there");
          }
        }

        const [lessonCatalog, todayRoutines] = await Promise.all([
          fetchDashboardLessons().catch(() => []),
          activeChildId ? fetchDashboardRoutines(activeChildId, localDateKey()).catch(() => []) : Promise.resolve([]),
        ]);

        if (ignore) return;
        setLessons(lessonCatalog);
        setRoutines(todayRoutines);
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
  }, [reloadKey]);

  if (isLoading) {
    return (
      <ChildSessionFrame className="gap-4">
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <Loader2 className="size-10 animate-spin text-snow-primary" />
          <p className="mt-4 text-base font-bold text-snow-primary-dark">Loading your calm space...</p>
        </div>
      </ChildSessionFrame>
    );
  }

  if (error && !session) {
    return (
      <ChildSessionFrame className="gap-4">
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="size-10 text-snow-error" />
          <h2 className="mt-3 text-lg font-black text-snow-primary-dark">Unable to load session</h2>
          <p className="mt-2 text-sm font-semibold text-snow-muted">{error}</p>
          <SnowButton variant="soft" onClick={reload} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try again
          </SnowButton>
        </div>
      </ChildSessionFrame>
    );
  }

  const primaryActions = [
    {
      href: "/companion",
      title: "Talk with AgentKid",
      subtitle: "Start a calm conversation.",
      icon: Sparkles,
      tone: "from-snow-primary to-snow-pink",
    },
    {
      href: "/session/routine",
      title: "Today's Routine",
      subtitle: routines.length > 0 ? `${routines.length} routine(s) ready.` : "See the next gentle step.",
      icon: CalendarCheck,
      tone: "from-snow-primary to-snow-aqua",
    },
    {
      href: "/session/lessons",
      title: "Practice Lesson",
      subtitle: lessons.length > 0 ? `${lessons.length} lesson(s) available.` : "Try one short activity.",
      icon: BookOpen,
      tone: "from-snow-aqua to-snow-success",
    },
    {
      href: "/session/activities",
      title: "Feeling Check-in",
      subtitle: "Name how today feels.",
      icon: Heart,
      tone: "from-snow-peach to-snow-pink",
    },
  ];

  const recommendedLessons = lessons.slice(0, 3);

  return (
    <ChildSessionFrame className="gap-4">
      {/* Hero Welcome */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px] snow-enter-soft">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender">
          <div className="grid min-h-[250px] gap-4 px-6 py-7 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
            <div className="relative z-10 min-w-0">
              <p className="text-sm font-black text-snow-primary">Hi {childName}</p>
              <h1 className="snow-title mt-2 max-w-[620px] font-black text-snow-primary-dark md:text-[42px]">
                Start with AgentKid, then pick one small step.
              </h1>
              <p className="snow-body-copy snow-font-readable mt-4 max-w-[520px] font-semibold text-snow-muted">
                Choose a calm conversation, a short lesson, a feeling check, or today&apos;s routine.
              </p>
            </div>
            <div className="relative hidden h-[210px] lg:block snow-float-soft">
              <Image
                src="/images/snow-mascot-ui.png"
                alt=""
                fill
                priority
                sizes="340px"
                className="object-contain object-right-bottom"
              />
            </div>
          </div>
        </div>

        <Link
          href="/companion"
          className="snow-interactive-card snow-focus-ring flex min-h-[250px] flex-col justify-between rounded-[var(--radius-xl)] bg-gradient-to-br from-snow-primary to-snow-pink p-6 text-white shadow-[var(--shadow-card)] xl:min-h-full"
        >
          <div>
            <Sparkles className="size-7" />
            <h2 className="mt-5 text-[28px] font-black leading-tight">Talk with AgentKid</h2>
            <p className="snow-body-copy mt-3 max-w-[230px] font-bold text-white/90">
              AgentKid listens first, then helps you choose what comes next.
            </p>
          </div>
          <span className="grid size-12 place-items-center rounded-full bg-white text-snow-primary">
            <ArrowRight className="size-5" />
          </span>
        </Link>
      </section>

      {/* Primary Actions Grid */}
      <section className="grid gap-4 md:grid-cols-3 snow-enter-soft">
        {primaryActions.slice(1).map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`snow-interactive-card snow-focus-ring flex min-h-[150px] flex-col rounded-[var(--radius-xl)] bg-gradient-to-br ${card.tone} p-5 text-white shadow-[var(--shadow-card)]`}
            >
              <Icon className="size-6" />
              <h2 className="mt-4 text-xl font-black leading-tight">{card.title}</h2>
              <p className="snow-body-copy mt-2 flex-1 font-bold text-white/90">{card.subtitle}</p>
              <span className="mt-4 grid size-10 place-items-center rounded-full bg-white text-snow-primary">
                <ArrowRight className="size-5" />
              </span>
            </Link>
          );
        })}
      </section>

      {/* Recommended Practice Lessons */}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] snow-enter-soft">
        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-snow-primary">Ready next</p>
              <h2 className="snow-heading mt-1 font-black text-snow-primary-dark">Small practice choices</h2>
            </div>
            <Link href="/session/lessons" className="text-sm font-black text-snow-primary">
              See lessons
            </Link>
          </div>

          {recommendedLessons.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-snow-muted">
              No lessons published yet in the catalog. Check back soon for new practice activities.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {recommendedLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/session/lessons/${lesson.id}`}
                  className="snow-interactive-card snow-focus-ring flex items-center gap-3 rounded-[var(--radius-md)] bg-snow-surface-soft p-3"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-snow-ice">
                    <Image src="/images/lesson-math.png" alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-snow-primary-dark">{lesson.title}</p>
                    <p className="snow-body-small snow-font-readable mt-0.5 font-semibold text-snow-muted">
                      {lesson.subject}
                      {lesson.estimatedMinutes ? ` • ${lesson.estimatedMinutes} min` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <Stars className="size-6 text-snow-primary" />
            <p className="mt-4 text-lg font-black text-snow-primary-dark">AgentKid keeps it simple</p>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
              One choice, one step, then a calm pause. You can stop anytime.
            </p>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-black text-snow-primary">Good next move</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">
              Start with one short lesson after talking with AgentKid.
            </p>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">
              That usually keeps the day feeling calm and clear.
            </p>
          </div>
        </div>
      </section>
    </ChildSessionFrame>
  );
}
