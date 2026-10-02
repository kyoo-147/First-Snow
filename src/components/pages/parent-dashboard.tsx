import Image from "next/image";
import Link from "next/link";
import { AudioLines, BookOpen, CalendarCheck, ChevronRight, Clock, Heart, PlayCircle, Sparkles, UserRound } from "lucide-react";
import { PageHeader, ParentPageFrame } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import { getChildById } from "@/data";
import { cn } from "@/lib/utils";

const topStats = [
  { title: "Routines completed", value: "4 / 5", detail: "Great consistency", tone: "bg-snow-primary-soft", icon: CalendarCheck, image: "/images/snow-mascot-ui.png" },
  { title: "Lessons practiced", value: "3", detail: "Across 2 subjects", tone: "bg-snow-ice", icon: BookOpen, image: "/images/lesson-math.png" },
  { title: "Feelings check-ins", value: "3", detail: "Mostly positive", tone: "bg-snow-aqua/35", icon: Heart, image: "/images/taking_deep_breaths_illustration.png" },
  { title: "Total time", value: "45 min", detail: "+15 min vs yesterday", tone: "bg-snow-lavender", icon: Clock, image: "/images/snow-connected-care.png" },
];

const activityTimeline = [
  { time: "9:05 AM", title: "Talked with AgentKid", detail: '"I feel happy because I played with my friends."', icon: AudioLines, tag: "Feeling check-in" },
  { time: "9:30 AM", title: "Lesson: The Magic Word Box", detail: "Letters & sounds, 4.8 parent rating", icon: BookOpen, tag: "Lesson" },
  { time: "10:00 AM", title: "Routine: Morning plan", detail: "Completed 4 of 5 steps", icon: CalendarCheck, tag: "Done" },
  { time: "10:25 AM", title: "Feelings check-in", detail: '"A little nervous before my spelling test."', icon: Heart, tag: "Processing" },
  { time: "11:40 AM", title: "Lesson: Count with Baby Penguins", detail: "Numbers 1-10, 4.9 parent rating", icon: BookOpen, tag: "Lesson" },
];

const observations = [
  { title: "Expressing more feelings", body: "Minh is opening up and sharing more about how they feel. Keep applauding their honesty." },
  { title: "Building learning stamina", body: "Minh stayed focused longer during lessons today. Great progress." },
  { title: "Seeks connection", body: "Minh reached out to chat with AgentKid twice when feeling unsure. That's okay." },
];

const nextSteps = [
  "Practice letter sounds for 5 minutes together.",
  "Play a feelings-matching game at bedtime.",
  "Use a wind-down story before sleep.",
];

export function ParentDashboard() {
  const child = getChildById("minh");

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Parent portal"
        title={`${child.name}'s day`}
        description={`A calm daily view of how ${child.name} learned, responded, and moved through today's sessions with AgentKid.`}
        action={
          <SnowCard className="w-full min-w-[300px] p-4">
            <div className="flex items-center gap-3">
              <Image src={child.avatarUrl || "/images/snow-avatar-final.png"} alt={child.name} width={52} height={52} className="rounded-full bg-snow-ice object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-snow-primary-dark">{child.name}</p>
                <p className="snow-body-small snow-font-readable font-bold text-snow-muted">Age {child.age} - {child.grade}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={`/parent/children/${child.id}/sessions`} className="snow-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-snow-border text-xs font-black text-snow-primary-dark">
                <UserRound className="size-3.5" /> Review
              </Link>
              <Link href="/session/home" className="snow-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-snow-primary text-xs font-black text-white">
                <Sparkles className="size-3.5" /> Open app
              </Link>
            </div>
          </SnowCard>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((item) => {
          const Icon = item.icon;
          return (
            <SnowCard key={item.title} className={`relative h-full min-h-[150px] overflow-hidden p-5 ${item.tone}`}>
              <div className="relative z-10 flex h-full items-start justify-between gap-3">
                <div className="max-w-[65%]">
                  <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">{item.title}</p>
                  <p className="mt-3 text-[clamp(1.6rem,1.7vw,2rem)] font-black leading-tight text-snow-primary-dark">{item.value}</p>
                  <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">{item.detail}</p>
                </div>
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-snow-surface/80">
                  <Icon className="size-5 text-snow-primary-dark" />
                </div>
              </div>
              <Image src={item.image} alt="" width={120} height={120} className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-90" />
            </SnowCard>
          );
        })}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.86fr)_340px]">
        <div className="space-y-4">
          <SnowCard className="snow-card-pad">
            <div className="flex items-center justify-between gap-4 border-b border-snow-border pb-4">
              <div>
                <h2 className="snow-heading font-black text-snow-primary-dark">Today&apos;s activity timeline</h2>
                <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">A parent-safe sequence of how {child.name} moved through the day.</p>
              </div>
              <Link href={`/parent/children/${child.id}/timeline`} className="rounded-full bg-snow-primary-soft px-3 py-1.5 text-xs font-black text-snow-primary">View full timeline</Link>
            </div>
            <div className="mt-4 space-y-0">
              {activityTimeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.time + item.title} className="grid grid-cols-[76px_34px_minmax(0,1fr)] gap-3">
                    <p className="pt-3 text-xs font-black text-snow-muted">{item.time}</p>
                    <div className="flex flex-col items-center">
                      <span className="grid size-8 place-items-center rounded-full bg-snow-primary-soft text-snow-primary"><Icon className="size-4" /></span>
                      {index < activityTimeline.length - 1 ? <span className="h-12 w-px bg-snow-border" /> : null}
                    </div>
                    <div className="pb-4 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-snow-primary-dark">{item.title}</p>
                        <span className="rounded-full bg-snow-surface-soft px-2 py-1 text-[11px] font-black text-snow-primary-dark">{item.tag}</span>
                      </div>
                      <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SnowCard>

          <SnowCard className="overflow-hidden">
            <div className="p-5">
              <h2 className="snow-heading font-black text-snow-primary-dark">Favorite moment</h2>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{child.name}&apos;s favorite story today.</p>
            </div>
            <div className="relative mx-5 h-44 overflow-hidden rounded-[var(--radius-lg)] bg-snow-ice">
              <Image src="/images/lesson-story.png" alt="" fill sizes="560px" className="object-cover" />
              <span className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-snow-surface text-snow-primary shadow-[var(--shadow-card)]"><PlayCircle className="size-7" /></span></span>
            </div>
            <div className="p-5">
              <p className="text-sm font-black text-snow-primary-dark">The Brave Little Fox</p>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">&quot;I love when the fox helps her friends.&quot; - Minh</p>
            </div>
          </SnowCard>
        </div>

        <div className="space-y-4">
          <SnowCard className="snow-card-pad">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="snow-heading font-black text-snow-primary-dark">Emotion trend</h2>
                <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">Observation of learning steadiness and comfort this week.</p>
              </div>
              <span className="rounded-full bg-snow-ice px-3 py-1.5 text-xs font-black text-snow-primary-dark">This week</span>
            </div>
            <div className="relative h-32 w-full pt-4">
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                <path d="M 10,60 L 70,50 L 130,40 L 190,45 L 250,30" fill="none" stroke="var(--snow-chart-purple)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 10,65 L 70,58 L 130,45 L 190,48 L 250,38" fill="none" stroke="var(--snow-chart-teal)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs font-black text-snow-muted"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
            </div>
          </SnowCard>

          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading font-black text-snow-primary-dark">Suggested next step</h2>
            <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">Simple ideas to support Minh&apos;s next calm practice block.</p>
            <div className="mt-4 space-y-3">
              {nextSteps.map((step) => (
                <button key={step} type="button" className={cn("snow-focus-ring snow-interactive-card flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3 text-left")}>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-snow-primary" />
                  <p className="snow-body-copy snow-font-readable font-semibold text-snow-primary-dark">{step}</p>
                </button>
              ))}
            </div>
          </SnowCard>
        </div>

        <aside className="space-y-4">
          <SnowCard className="snow-card-pad bg-snow-ice/55">
            <h2 className="snow-heading flex items-center gap-2 font-black text-snow-primary-dark"><Heart className="size-5 text-snow-primary" /> What AgentKid noticed</h2>
            <div className="mt-4 space-y-3">
              {observations.map((item) => (
                <div key={item.title} className="rounded-[var(--radius-md)] bg-snow-surface p-4">
                  <p className="text-sm font-black text-snow-primary-dark">{item.title}</p>
                  <p className="snow-body-copy snow-font-readable mt-2 font-semibold text-snow-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </SnowCard>

          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading font-black text-snow-primary-dark">Safety & settings</h2>
            <div className="mt-4 space-y-3">
              {["Topics: school, friendship, feelings", "Screen time: 1h 15m daily limit", "Voice access: kid voice enabled", "Parent controls: permissions & data"].map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                  <p className="snow-body-small snow-font-readable font-bold text-snow-primary-dark">{item}</p>
                  <ChevronRight className="size-4 shrink-0 text-snow-primary" />
                </div>
              ))}
            </div>
          </SnowCard>

          <SnowCard className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-4 bg-snow-lavender p-4">
            <Image src="/images/snow-mascot-ui.png" alt="" width={72} height={72} className="object-contain" />
            <div>
              <p className="text-sm font-black text-snow-primary-dark">You&apos;re doing an amazing job.</p>
              <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">Your support helps Minh feel safe, curious, and ready to learn.</p>
            </div>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
