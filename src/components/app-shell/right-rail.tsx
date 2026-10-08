import Link from "next/link";
import { BookOpen, Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { t } from "@/i18n";

export function LessonRightRail() {
  return (
    <div className="space-y-4">
      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">{ t("common", "learnMore") }</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          { t("parent", "lessonRail.answersSaved") }
        </p>
        <Link href="/session/lessons" className="snow-focus-ring mt-4 inline-flex rounded-full bg-snow-primary-soft px-4 py-2 text-sm font-black text-snow-primary-dark">
          { t("parent", "lessonRail.backToLessons") }
        </Link>
      </SnowCard>

      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <Heart className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">{ t("common", "cancel") }</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          { t("parent", "lessonRail.leaveLesson") }
        </p>
        <Link href="/session/activities" className="snow-focus-ring mt-4 inline-flex rounded-full border border-snow-border bg-snow-surface-soft px-4 py-2 text-sm font-black text-snow-primary-dark">
          { t("parent", "lessonRail.openFeelings") }
        </Link>
      </SnowCard>
    </div>
  );
}

export function TalkRightRail() {
  return (
    <div className="space-y-4">
      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">{ t("parent", "privacy.title") }</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          { t("parent", "privacy.cameraNotice") }
        </p>
      </SnowCard>

      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">{ t("parent", "companion.title") }</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          { t("parent", "companion.unavailableNotice") }
        </p>
      </SnowCard>

      <SnowCard className="bg-snow-lavender p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">{ t("common", "learnMore") }</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-primary-dark">
          { t("parent", "safety.unsafeNotice") }
        </p>
      </SnowCard>
    </div>
  );
}
