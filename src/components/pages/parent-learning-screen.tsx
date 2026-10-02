"use client";

import { BarChart3, BookOpen, CheckCircle2, Clock, GraduationCap, Star } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById, getLessonsByChildId } from "@/data";

export function ParentLearningScreen({ childId = "minh" }: { childId?: string }) {
  const child = getChildById(childId);
  const lessons = getLessonsByChildId(childId);

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={`${child.name}'s learning`}
        title="Learning progress"
        description={`A parent view of what ${child.name} practiced, where visual choices helped, and which lesson is best to revisit next.`}
        action={
          <SnowButton variant="soft">
            <BarChart3 className="mr-2 size-4" />
            Full report
          </SnowButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatusTile label="Practice time" value="32 min" detail="Across three short sessions" icon={<Clock className="size-5 text-snow-primary" />} />
        <StatusTile label="Lessons practiced" value="3" detail="Reading, math, feelings" icon={<BookOpen className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Comfort pattern" value="Steady" detail="Short prompts worked well" icon={<Star className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
        <StatusTile label="Next focus" value="Reading" detail="Repeat familiar story first" icon={<GraduationCap className="size-5 text-snow-primary" />} tone="bg-snow-cream" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SnowCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-snow-primary-dark">Skill map</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">Progress is shown as practice coverage, not as a clinical score.</p>
            </div>
            <span className="rounded-full bg-snow-primary-soft px-3 py-1.5 text-xs font-black text-snow-primary">This week</span>
          </div>
          <div className="mt-5 grid gap-4 2xl:grid-cols-2">
            {[
              { label: "Reading confidence", value: 72, note: "Strongest after story warm-up" },
              { label: "Counting practice", value: 48, note: "Best with image choices" },
              { label: "Feeling words", value: 64, note: "Used more words during check-in" },
              { label: "Routine transitions", value: 56, note: "Improved after a short pause" },
            ].map((skill) => (
              <div key={skill.label} className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-snow-primary-dark">{skill.label}</p>
                  <p className="text-xs font-bold text-snow-muted">{skill.value}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-snow-surface">
                  <div className="h-full rounded-full bg-snow-primary" style={{ width: `${skill.value}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-snow-muted">{skill.note}</p>
              </div>
            ))}
          </div>
        </SnowCard>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Suggested next step</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">Start tomorrow with the fox story, then move into one short counting activity.</p>
            <button className="mt-4 rounded-full bg-snow-primary px-4 py-2.5 text-sm font-black text-white">Save for tomorrow</button>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Recent lessons</h2>
            <div className="mt-4 space-y-3">
              {lessons.slice(0, 4).map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-3 py-3">
                  <CheckCircle2 className="size-4 shrink-0 text-snow-success" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-snow-primary-dark">{lesson.title}</p>
                    <p className="text-xs font-semibold text-snow-muted">{lesson.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
