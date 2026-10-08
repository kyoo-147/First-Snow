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
import { t } from "@/i18n";

export function ExploreScreen() {
  const topics = [
    { name: t("child", "explore.topics.english"), icon: BookOpen },
    { name: t("child", "explore.topics.math"), icon: Calculator },
    { name: t("child", "explore.topics.storyTime"), icon: BookOpen },
    { name: t("child", "explore.topics.socialSkills"), icon: Heart },
    { name: t("child", "explore.topics.science"), icon: FlaskConical },
    { name: t("child", "explore.topics.creative"), icon: Palette },
    { name: t("child", "explore.topics.more"), icon: Ellipsis },
  ];

  const paths = [
    { title: t("child", "explore.paths.readingExplorerTitle"), desc: t("child", "explore.paths.readingExplorerDesc"), progress: 60, lessons: t("child", "explore.paths.readingExplorerLessons"), color: "bg-snow-primary" },
    { title: t("child", "explore.paths.mathExplorerTitle"), desc: t("child", "explore.paths.mathExplorerDesc"), progress: 40, lessons: t("child", "explore.paths.mathExplorerLessons"), color: "bg-snow-aqua" },
    { title: t("child", "explore.paths.kindHeartTitle"), desc: t("child", "explore.paths.kindHeartDesc"), progress: 75, lessons: t("child", "explore.paths.kindHeartLessons"), color: "bg-snow-pink" },
    { title: t("child", "explore.paths.scienceExplorerTitle"), desc: t("child", "explore.paths.scienceExplorerDesc"), progress: 30, lessons: t("child", "explore.paths.scienceExplorerLessons"), color: "bg-snow-success" },
  ];

  const adventures = [
    { title: t("child", "explore.adventures.oceanTitle"), desc: t("child", "explore.adventures.oceanDesc"), color: "from-snow-primary to-snow-aqua" },
    { title: t("child", "explore.adventures.spaceTitle"), desc: t("child", "explore.adventures.spaceDesc"), color: "from-snow-primary-dark to-snow-primary" },
    { title: t("child", "explore.adventures.dinoTitle"), desc: t("child", "explore.adventures.dinoDesc"), color: "from-snow-lavender to-snow-pink" },
    { title: t("child", "explore.adventures.springTitle"), desc: t("child", "explore.adventures.springDesc"), color: "from-snow-mint to-snow-blush" },
  ];

  return (
    <div className="space-y-6 overflow-hidden pt-1">
      <div>
        <h1 className="flex items-center gap-2 text-[30px] font-black text-snow-primary-dark sm:text-[36px]">
          {t("child", "explore.title")} <Sparkles className="size-6 text-snow-primary" />
        </h1>
        <p className="mt-3 text-base font-bold text-snow-muted">{t("child", "explore.subtitle")}</p>
      </div>

      <div className="flex min-h-13 items-center gap-3 rounded-full border border-snow-border bg-snow-surface px-5 shadow-[var(--shadow-card)]">
        <Search className="size-5 shrink-0 text-snow-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-snow-muted">{t("child", "explore.searchPlaceholder")}</span>
        <button className="flex shrink-0 items-center gap-2 border-l border-snow-border pl-4 text-sm font-black text-snow-primary-dark">
          <Filter className="size-4" /> {t("child", "explore.filters")}
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
          <p className="text-xs font-black uppercase text-white/80">{t("child", "explore.featuredCollection")}</p>
          <h2 className="mt-3 text-[40px] font-black leading-none">{t("child", "explore.featuredTitle")}</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-white/88">{t("child", "explore.featuredDescription")}</p>
          <Link href="/session/lessons" className="mt-5 inline-flex items-center gap-2 rounded-full bg-snow-primary-dark px-5 py-3 text-sm font-black text-white">
            {t("child", "explore.exploreCollection")} <ChevronRight className="size-4" />
          </Link>
        </div>
        <Image src="/images/snow-mascot-ui.png" alt="" width={240} height={176} className="absolute bottom-0 right-8 hidden object-cover md:block" />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black text-snow-primary-dark">{t("child", "explore.recommendedPaths")}</h2>
          <button className="w-fit rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-sm font-black text-snow-primary-dark shadow-[var(--shadow-card)]">{t("child", "explore.seeAllPaths")}</button>
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
              <p className="mt-2 text-xs font-semibold text-snow-muted">{t("child", "explore.lessonsCount", { count: path.lessons })}</p>
              <button className="absolute bottom-4 right-4 grid size-8 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark shadow-sm">
                <ChevronRight className="size-4" />
              </button>
            </SnowCard>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-black text-snow-primary-dark">{t("child", "explore.discoverNew")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)]">
              {t("child", "explore.allAges")} <ChevronDown className="size-3" />
            </button>
            <button className="flex items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 py-2 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)]">
              {t("child", "explore.sortRecommended")} <ChevronDown className="size-3" />
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
            <Flame className="size-5 fill-snow-warning text-snow-warning" /> {t("child", "explore.trendingAdventures")}
          </h2>
          <p className="text-sm font-bold text-snow-muted">{t("child", "explore.trendingSubtitle")}</p>
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
