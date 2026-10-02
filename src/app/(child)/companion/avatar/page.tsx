"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const VtuberApp = dynamic(
  () => import("@/components/vtuber-wrapper").then((mod) => mod.VtuberApp),
  { ssr: false },
);

export default function AvatarCompanionPage() {
  return (
    <main className="relative h-[100dvh] overflow-hidden bg-snow-primary-dark">
      <Link
        href="/companion"
        className="snow-focus-ring fixed left-4 top-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-black text-snow-primary-dark shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-white"
      >
        <ChevronLeft className="size-4" />
        Back to AgentKid app
      </Link>
      <VtuberApp />
    </main>
  );
}
