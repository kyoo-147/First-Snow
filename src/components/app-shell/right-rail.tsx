import Link from "next/link";
import { BookOpen, Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function LessonRightRail() {
  return (
    <div className="space-y-4">
      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">Lesson help</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          Your answers are saved to this lesson attempt. A score appears only when the lesson contains graded questions.
        </p>
        <Link href="/session/lessons" className="snow-focus-ring mt-4 inline-flex rounded-full bg-snow-primary-soft px-4 py-2 text-sm font-black text-snow-primary-dark">
          Back to lessons
        </Link>
      </SnowCard>

      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <Heart className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">Need a pause?</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          You can leave a lesson and return later. AgentKid will not invent progress or mark it complete until the completion request succeeds.
        </p>
        <Link href="/session/activities" className="snow-focus-ring mt-4 inline-flex rounded-full border border-snow-border bg-snow-surface-soft px-4 py-2 text-sm font-black text-snow-primary-dark">
          Open feelings check-in
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
          <h2 className="text-lg font-black text-snow-primary-dark">Private by default</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          Camera, screen sharing, and microphone capture stay off unless a caregiver consent, browser permission, and server capability grant are all present.
        </p>
      </SnowCard>

      <SnowCard className="p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">Text companion</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">
          If the companion service is unavailable, AgentKid will say so instead of making up a reply. Sent messages may be available to your caregiver in transcripts.
        </p>
      </SnowCard>

      <SnowCard className="bg-snow-lavender p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-snow-primary" />
          <h2 className="text-lg font-black text-snow-primary-dark">Need more help?</h2>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-snow-primary-dark">
          If you feel unsafe or very worried, tell a trusted grown-up nearby. AgentKid cannot contact people or emergency services for you.
        </p>
      </SnowCard>
    </div>
  );
}
