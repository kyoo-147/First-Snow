"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, CalendarCheck, Clock, Heart, MessageSquare, Plus, ShieldCheck, Sparkles, Star, SunMedium } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { mockChildren, getSessionsByChildId } from "@/data";
import { formatSnowDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ParentChildrenScreen() {
  const [selectedChildId, setSelectedChildId] = useState("minh");
  const selectedChild = mockChildren.find((child) => child.id === selectedChildId) ?? mockChildren[0];
  const selectedSessions = getSessionsByChildId(selectedChild.id);
  const latestSession = selectedSessions[0] ?? null;

  return (
    <ParentPageFrame className="space-y-4">
      <PageHeader
        eyebrow="Parent portal"
        title="My children"
        description="Select a child to review sessions, learning progress, routines, and parent-only safety settings."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/session/home" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-snow-primary px-5 text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition hover:brightness-105">
              <Sparkles className="size-4" />
              Open child app
            </Link>
            <SnowButton variant="ghost">
              <Plus className="mr-2 size-5" />
              Add child
            </SnowButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatusTile label="Selected child" value={`${selectedChild.name}, age ${selectedChild.age}`} detail={selectedChild.grade} icon={<Heart className="size-5 text-snow-primary" />} />
        <StatusTile label="Recent session" value={latestSession ? `${latestSession.durationMinutes} minutes` : "No session"} detail={latestSession?.title ?? "Ready for first check-in"} icon={<Clock className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Review status" value="2 items" detail="One alert and one timeline update" icon={<Activity className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
        <StatusTile label="Privacy" value="Preview off" detail="Camera review stays parent-only" icon={<ShieldCheck className="size-5 text-snow-primary" />} tone="bg-snow-cream" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <SnowCard className="overflow-hidden">
            <div className="grid gap-5 bg-snow-primary-soft/50 p-5 md:grid-cols-[auto_minmax(0,1fr)]">
              <div className="relative size-28 overflow-hidden rounded-full border-8 border-snow-surface shadow-[var(--shadow-soft)]">
                <Image src={selectedChild.avatarUrl || "/images/snow-avatar-final.png"} alt={selectedChild.name} fill sizes="112px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-snow-primary px-3 py-1 text-xs font-black text-white">Selected child</span>
                  <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary-dark">Age {selectedChild.age}</span>
                  <span className="rounded-full bg-snow-surface px-3 py-1 text-xs font-black text-snow-primary-dark">{selectedChild.grade}</span>
                </div>
                <h2 className="mt-3 text-[32px] font-black leading-tight text-snow-primary-dark">{selectedChild.name}</h2>
                <p className="mt-2 max-w-[58ch] text-sm font-semibold leading-6 text-snow-muted">{selectedChild.comfortStyle}</p>
              </div>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                <p className="text-xs font-black text-snow-muted">Recent mood</p>
                <p className="mt-1 text-lg font-black capitalize text-snow-primary-dark">{latestSession?.mood || "N/A"}</p>
                <p className="mt-1 text-xs font-semibold text-snow-muted">{latestSession ? formatSnowDate(latestSession.date) : "No session yet"}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                <p className="text-xs font-black text-snow-muted">Next action</p>
                <p className="mt-1 text-lg font-black text-snow-primary-dark">Review routine</p>
                <p className="mt-1 text-xs font-semibold text-snow-muted">Use one calm card</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                <p className="text-xs font-black text-snow-muted">Parent-only</p>
                <p className="mt-1 text-lg font-black text-snow-primary-dark">Preview off</p>
                <p className="mt-1 text-xs font-semibold text-snow-muted">Camera stays hidden</p>
              </div>
            </div>
            <div className="grid gap-3 border-t border-snow-border p-5 sm:grid-cols-3">
              <Link href={`/parent/children/${selectedChild.id}/timeline`} className="block">
                <SnowButton variant="soft" className="w-full justify-center">
                  <Activity className="mr-2 size-4" />
                  Timeline
                </SnowButton>
              </Link>
              <Link href={`/parent/children/${selectedChild.id}/sessions`} className="block">
                <SnowButton variant="soft" className="w-full justify-center">
                  Sessions
                </SnowButton>
              </Link>
              <Link href={`/parent/children/${selectedChild.id}/routines`} className="block">
                <SnowButton className="w-full justify-center">
                  Routine
                </SnowButton>
              </Link>
            </div>
          </SnowCard>

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.96fr)_minmax(360px,0.72fr)]">
            <SnowCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-snow-primary-dark">Family roster</h2>
                  <p className="mt-1 text-sm font-semibold text-snow-muted">Switch between child profiles without leaving the parent portal.</p>
                </div>
                <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">{mockChildren.length} active</span>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {mockChildren.map((child) => {
                  const childSessions = getSessionsByChildId(child.id);
                  const lastSession = childSessions.length > 0 ? childSessions[0] : null;
                  const isSelected = child.id === selectedChildId;

                  return (
                    <button
                      key={child.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedChildId(child.id)}
                      className={cn(
                        "snow-focus-ring snow-interactive-card overflow-hidden rounded-[var(--radius-lg)] border text-left",
                        isSelected ? "border-snow-primary bg-snow-primary-soft/70" : "border-snow-border bg-snow-surface",
                      )}
                    >
                      <div className={cn("grid gap-4 p-4 md:grid-cols-[88px_minmax(0,1fr)]", isSelected ? "bg-snow-primary-soft/30" : "bg-snow-surface-soft/70")}>
                        <div className="relative size-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface shadow-[var(--shadow-soft)]">
                          <Image src={child.avatarUrl || "/images/snow-avatar-final.png"} alt={child.name} fill sizes="88px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", isSelected ? "bg-snow-primary text-white" : "bg-snow-primary-soft text-snow-primary-dark")}>
                              {isSelected ? "Open profile" : "Child profile"}
                            </span>
                            <span className="rounded-full bg-snow-surface px-2.5 py-1 text-[11px] font-black text-snow-primary-dark">Age {child.age}</span>
                          </div>
                          <h3 className="mt-3 text-2xl font-black leading-tight text-snow-primary-dark">{child.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-snow-muted">{child.grade}</p>
                          <p className="mt-3 text-sm font-semibold leading-6 text-snow-muted">{child.comfortStyle}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 border-t border-snow-border p-4 sm:grid-cols-3">
                        <div className="rounded-[var(--radius-md)] bg-snow-surface-soft px-3 py-2">
                          <p className="text-[11px] font-black text-snow-muted">Latest session</p>
                          <p className="mt-1 text-sm font-black text-snow-primary-dark">{lastSession ? `${lastSession.durationMinutes} min` : "Ready"}</p>
                        </div>
                        <div className="rounded-[var(--radius-md)] bg-snow-ice px-3 py-2">
                          <p className="text-[11px] font-black text-snow-muted">Mood</p>
                          <p className="mt-1 text-sm font-black capitalize text-snow-primary-dark">{lastSession?.mood ?? "Calm"}</p>
                        </div>
                        <div className="rounded-[var(--radius-md)] bg-snow-lavender px-3 py-2">
                          <p className="text-[11px] font-black text-snow-muted">Next review</p>
                          <p className="mt-1 text-sm font-black text-snow-primary-dark">Sessions</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SnowCard>

            <SnowCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-snow-primary-dark">Selected child snapshot</h2>
                  <p className="mt-1 text-sm font-semibold text-snow-muted">A quick surface for next parent actions.</p>
                </div>
                <span className="rounded-full bg-snow-cream px-3 py-1 text-xs font-black text-snow-primary-dark">Today</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                    <Clock className="size-3.5 text-snow-primary" />
                    Latest session
                  </p>
                  <p className="mt-2 text-lg font-black text-snow-primary-dark">{latestSession?.title ?? "Ready to begin"}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">{latestSession ? formatSnowDate(latestSession.date) : "No guided session yet"}</p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-snow-ice p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                    <SunMedium className="size-3.5 text-snow-primary" />
                    Comfort pattern
                  </p>
                  <p className="mt-2 text-lg font-black text-snow-primary-dark">Short, steady prompts</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">The child settles faster with familiar openings.</p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-snow-lavender p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                    <MessageSquare className="size-3.5 text-snow-primary" />
                    Parent queue
                  </p>
                  <p className="mt-2 text-lg font-black text-snow-primary-dark">Transcript + routine</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">Review the latest note, then keep tomorrow simple.</p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-snow-cream p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-snow-muted">
                    <Star className="size-3.5 text-snow-warning" />
                    Parent reminder
                  </p>
                  <p className="mt-2 text-lg font-black text-snow-primary-dark">Privacy stays parent-only</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">Camera preview remains off unless a parent explicitly reviews it.</p>
                </div>
              </div>
            </SnowCard>
          </div>

          <SnowCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-snow-primary-dark">Next actions</h2>
              <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">Parent flow</span>
            </div>
            <div className="mt-4 space-y-3">
              {mockChildren.map((child) => {
                const childSessions = getSessionsByChildId(child.id);
                const lastSession = childSessions.length > 0 ? childSessions[0] : null;
                const isSelected = child.id === selectedChildId;

                return (
                  <Link
                    key={child.id}
                    href={`/parent/children/${child.id}/sessions`}
                    className={cn(
                      "snow-focus-ring snow-interactive-card flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left",
                      isSelected ? "border-snow-primary bg-snow-primary-soft" : "border-snow-border bg-snow-surface-soft",
                    )}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-full border border-snow-border bg-snow-surface">
                      <Image src={child.avatarUrl || "/images/snow-avatar-final.png"} alt={child.name} fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-snow-primary-dark">{child.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-snow-muted">Age {child.age} - {lastSession ? `${lastSession.durationMinutes} min latest` : "Ready to start"}</span>
                    </span>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", isSelected ? "bg-snow-primary text-white" : "bg-snow-success/15 text-snow-success")}>
                      {isSelected ? "Selected" : "Review"}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] bg-snow-ice px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-black text-snow-primary-dark">
                <Sparkles className="size-4 text-snow-primary" />
                Best next step
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-snow-muted">Review the latest session, then pick one calm follow-up for tomorrow.</p>
            </div>
          </SnowCard>
        </div>

        <aside className="space-y-4">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Parent review queue</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Transcript preview", detail: `Latest ${selectedChild.name} conversation`, href: `/parent/children/${selectedChild.id}/transcripts`, icon: MessageSquare },
                { label: "Routine progress", detail: "3 of 4 steps complete", href: `/parent/children/${selectedChild.id}/routines`, icon: CalendarCheck },
                { label: "Camera preview", detail: "Still off by default", href: "/parent/privacy", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;

                return (
                <Link key={item.label} href={item.href} className="snow-focus-ring snow-interactive-card group flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-snow-surface text-snow-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-snow-primary-dark">{item.label}</span>
                    <span className="mt-1 block text-xs font-semibold text-snow-muted">{item.detail}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-snow-muted transition group-hover:text-snow-primary" />
                </Link>
              );
              })}
            </div>
          </SnowCard>
          <SnowCard className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark">
              <CalendarCheck className="size-5 text-snow-primary" />
              Today with {selectedChild.name}
            </h2>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-snow-muted">
              <p>Morning check-in completed with short prompts.</p>
              <p>Story practice worked better before math.</p>
              <p>Suggested next step: one calm routine card.</p>
            </div>
          </SnowCard>
          <SnowCard className="bg-snow-lavender p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">Privacy status</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Camera preview is off by default. Emergency alert settings are parent-only.</p>
          </SnowCard>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
