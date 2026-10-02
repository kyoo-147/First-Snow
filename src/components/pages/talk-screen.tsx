"use client";

import Image from "next/image";
import Link from "next/link";
import { MonitorPlay, Sparkles } from "lucide-react";
import { TalkShell } from "@/components/companion/talk-shell";

export function TalkScreen() {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <header className="z-10 mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-4xl font-black text-snow-primary-dark">
            Talk with AgentKid <Sparkles className="size-6 text-snow-primary" />
          </h1>
          <p className="mt-2 text-base font-bold text-snow-muted">
            Your safe space to share, feel, and grow.
          </p>
        </div>
        <Link
          href="/companion/avatar"
          className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft"
        >
          <MonitorPlay className="size-4 text-snow-primary" />
          Avatar mode
        </Link>
      </header>

      {/* Mascot decoration */}
      <div className="-mr-10 absolute right-0 top-0 z-0 hidden lg:block">
        <Image
          src="/images/snow-mascot.png"
          alt=""
          width={160}
          height={160}
          className="opacity-90 drop-shadow-lg"
        />
      </div>

      {/* Real API-backed chat shell */}
      <TalkShell childId="minh" />
    </div>
  );
}
