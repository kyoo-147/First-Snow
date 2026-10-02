import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  Filter,
  Flame,
  FlaskConical,
  Heart,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import { LessonCard } from "@/components/lessons/lesson-card";
import { SnowCard } from "@/components/ui/snow-card";
import { lessons } from "@/data/snow-data";

export function ExploreScreen() {
  const topics = [
    { name: "English", icon: BookOpen },
    { name: "Math", icon: Calculator },
    { name: "Story Time", icon: BookOpen },
    { name: "Social Skills", icon: Heart },
    { name: "Science", icon: FlaskConical },
    { name: "Creativity", icon: Palette },
    { name: "More", icon: Ellipsis },
  ];

  const paths = [
    { title: "Reading Adventurer", desc: "Build strong reading skills step by step.", progress: 60, lessons: "6 of 10", color: "bg-snow-primary" },
    { title: "Math Explorer", desc: "Solve problems and think like a math star.", progress: 40, lessons: "4 of 10", color: "bg-snow-aqua" },
    { title: "Kind Heart", desc: "Learn, share, and be your best self.", progress: 75, lessons: "6 of 8", color: "bg-snow-pink" },
    { title: "Science Discoverer", desc: "Ask questions and explore the world.", progress: 30, lessons: "3 of 10", color: "bg-snow-success" },
  ];

  const adventures = [
    { title: "Under the Sea", desc: "Explore ocean life", color: "from-snow-primary to-snow-aqua" },
    { title: "Space Voyage", desc: "Blast off to the stars", color: "from-snow-primary-dark to-snow-primary" },
    { title: "Dino Discovery", desc: "Learn about dinosaurs", color: "from-snow-lavender to-snow-pink" },
    { title: "Spring Adventures", desc: "Celebrate the season", color: "from-snow-mint to-snow-blush" },
  ];

  return (
    <div className="space-y-6 overflow-hidden pt-1">
      <div>
        <h1 className="flex items-center gap-2 text-[30px] font-black text-snow-primary-dark sm:text-[36px]">
          Explore <Sparkles className="size-6 text-snow-primary" />
        </h1>
        <p className="mt-3 text-base font-bold text-snow-muted">Discover lessons, stories, and new adventures to learn and grow.</p>
      </div>

      <div className="flex min-h-13 items-center gap-3 rounded-full border border-snow-border bg-snow-surface px-5 shadow-[var(--shadow-card)]">
        <Search className="size-5 shrink-0 text-snow-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-snow-muted">Search for lessons, stories, topics...</span>
        <button className="flex shrink-0 items-center gap-2 border-l border-snow-border pl-4 text-sm font-black text-snow-primary-dark">
          <Filter className="size-4" /> Filters
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <button key={topic.name} className="flex min-h-11 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-5 text-sm font-black text-snow-primary-dark shadow-[var(--shadow-card)]">
              <Icon className="size-4 text-snow-primary" />
              {topic.name}
            </button>
          );
        })}
      </div>

      <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-r from-snow-primary to-snow-aqua p-6 text-white shadow-[var(--shadow-soft)]">
        <div className="relative z-10 max-w-md">
          <p className="text-xs font-black uppercase text-white/80">Featured collection</p>
          <h2 className="mt-3 text-[40px] font-black leading-none">Ocean Explorers</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-white/88">Dive into the deep blue. Learn fun facts, read stories, and play games about sea life.</p>
          <Link href="/session/lessons" className="mt-5 inline-flex items-center gap-2 rounded-full bg-snow-primary-dark px-5 py-3 text-sm font-black text-white">
            Explore Collection <ChevronRight className="size-4" />
          </Link>
        </div>
        <Image src="/images/snow-mascot-ui.png" alt="" width={240} height={176} className="absolute bottom-0 right-8 hidden object-cover md:block" />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black text-snow-primary-dark">Recommended Learning Paths</h2>
          <button className="w-fit rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-sm font-black text-snow-primary-dark shadow-[var(--shadow-card)]">See all paths</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {paths.map((path) => (
            <SnowCard key={path.title} className="relative p-4">
              <h3 className="text-sm font-black text-snow-primary-dark">{path.title}</h3>
              <p className="mt-1 min-h-10 pr-10 text-xs font-semibold leading-5 text-snow-muted">{path.desc}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-snow-surface-soft">
                  <div className={`h-full rounded-full ${path.color}`} style={{ width: `${path.progress}%` }} />
                </div>
                <span className="text-xs font-black text-snow-primary-dark">{path.progress}%</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-snow-muted">{path.lessons} lessons</p>
              <button className="absolute bottom-4 right-4 grid size-8 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark shadow-sm">
                <ChevronRight className="size-4" />
              </button>
            </SnowCard>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-black text-snow-primary-dark">Discover Something New</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)]">
              All Ages <ChevronDown className="size-3" />
            </button>
            <button className="flex items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)]">
              Sort by: Recommended <ChevronDown className="size-3" />
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark">
            <Flame className="size-5 fill-snow-warning text-snow-warning" /> Trending Adventures
          </h2>
          <p className="text-sm font-bold text-snow-muted">What is popular with learners like you.</p>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {adventures.map((adv) => (
            <div key={adv.title} className={`flex min-h-24 min-w-[240px] flex-col justify-end rounded-[var(--radius-lg)] bg-gradient-to-r ${adv.color} p-4 text-white shadow-[var(--shadow-card)]`}>
              <h3 className="text-sm font-black text-white">{adv.title}</h3>
              <p className="text-xs font-bold text-white/80">{adv.desc}</p>
            </div>
          ))}
          <button className="grid size-12 shrink-0 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark shadow-[var(--shadow-card)]">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
