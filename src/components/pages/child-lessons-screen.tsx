"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Sparkles, Star } from "lucide-react";
import { ChildSessionFrame, PageHeader } from "@/components/layout/snow-page-frame";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { SnowCard } from "@/components/ui/snow-card";
import { getLessonsByChildId } from "@/data";

const accentBg = {
  primary: "bg-snow-primary-soft",
  aqua: "bg-snow-ice",
  peach: "bg-snow-cream",
  pink: "bg-snow-lavender",
  ice: "bg-snow-ice",
};

export function ChildLessonsScreen() {
  const lessons = getLessonsByChildId("minh");
  const featuredLesson = lessons[0];

  return (
    <ChildSessionFrame>
      <PageHeader title="Pick one lesson" description="Choose a short activity. AgentKid will guide the steps slowly." compact />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SnowCard className="overflow-hidden">
            <div className="grid gap-4 bg-gradient-to-r from-snow-ice via-snow-surface-soft to-snow-lavender p-5 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
              <div>
                <p className="text-xs font-black text-snow-primary">Best next start</p>
                <h2 className="snow-heading mt-2 text-[1.75rem] font-black text-snow-primary-dark">{featuredLesson.title}</h2>
                <p className="snow-body-copy snow-font-readable mt-2 max-w-[520px] font-semibold text-snow-muted">{featuredLesson.subtitle}. AgentKid can guide this as one short, calm activity.</p>
              </div>
              <div className={`relative h-36 rounded-[var(--radius-lg)] ${accentBg[featuredLesson.accent]}`}>
                <Image src={featuredLesson.image} alt="" fill className="object-contain p-4" />
              </div>
            </div>
          </SnowCard>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 snow-enter-soft">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/session/lessons/${lesson.id}`} className="group snow-focus-ring rounded-[var(--radius-lg)]">
                <SnowCard className="snow-interactive-card h-full overflow-hidden">
                  <div className={`relative h-40 ${accentBg[lesson.accent]} p-4`}>
                    <Image src={lesson.image} alt="" fill className="object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">
                      <BookOpen className="size-3.5" />
                      {lesson.subject}
                    </div>
                    <h2 className="text-lg font-black leading-tight text-snow-primary-dark">{lesson.title}</h2>
                    <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{lesson.subtitle}</p>
                    <div className="mt-4">
                      <ProgressStrip value={lesson.progress} />
                      <p className="mt-2 text-xs font-black text-snow-primary">{lesson.progress}% ready</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-snow-muted">
                      <span className="flex items-center gap-1"><Star className="size-3.5 text-snow-warning" /> {lesson.rating}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> {lesson.duration}</span>
                    </div>
                  </div>
                </SnowCard>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <SnowCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-snow-primary">Best next flow</p>
                  <h2 className="mt-1 text-lg font-black text-snow-primary-dark">Keep one short lesson visible</h2>
                </div>
                <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">Child-safe</span>
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
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Short lessons feel better when they read like invitations, not a giant catalog.</p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <p className="text-xs font-black text-snow-primary">Lesson rhythm</p>
            <p className="mt-2 text-lg font-black text-snow-primary-dark">One short activity is enough for this step.</p>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">The child flow stays calm when lessons feel like invitations, not a big content catalog.</p>
          </SnowCard>
          <div className="rounded-[var(--radius-xl)] bg-snow-primary-soft p-5">
            <p className="text-sm font-black text-snow-primary-dark">Good pairing</p>
            <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">Talk with AgentKid first, then open one lesson that matches the day&apos;s energy.</p>
          </div>
        </aside>
      </div>
    </ChildSessionFrame>
  );
}
