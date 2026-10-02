"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, Eye, Lock, Mic, Monitor, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapturePolicyItem {
  icon: typeof Mic;
  title: string;
  badge: string;
  summary: string;
  details: string[];
}

const capturePolicies: CapturePolicyItem[] = [
  {
    icon: Mic,
    title: "Microphone Audio Governance",
    badge: "Turn-by-turn",
    summary: "Active exclusively during child-initiated speech turns in supported activities.",
    details: [
      "Hardware capture is initiated only after a session has begun and speech input is active.",
      "Hardware muting is targeted while Snow is speaking or thinking.",
      "Audio is processed for immediate speech-to-text without continuous ambient background listening.",
    ],
  },
  {
    icon: Camera,
    title: "Camera & Video Input Governance",
    badge: "Parent-gated",
    summary: "Turned off by default. Requires active guardian consent before any stream is opened.",
    details: [
      "Camera preview remains completely hidden unless the guardian explicitly opts in.",
      "Policy specifies in-memory frame processing for interactive learning without persistent cloud media archives.",
      "Policy specifies no facial recognition, biometric profiling, or emotion classification scoring on captured frames.",
    ],
  },
  {
    icon: Eye,
    title: "Vision AI & Visual Understanding",
    badge: "Opt-in only",
    summary: "Visual reasoning operates solely during guardian-approved visual exercises.",
    details: [
      "Visual inputs are analyzed ephemerally in active lesson contexts (e.g. storybook drawings or homework flashcards).",
      "Analysis is constrained by child-safe content guardrails before passing to AI reasoning engines.",
      "All visual understanding events are logged for guardian transparency in the parent portal.",
    ],
  },
  {
    icon: Monitor,
    title: "Screen & Homework Review Capture",
    badge: "Session-scoped",
    summary: "Screen sharing operates only during guided homework and interactive learning sessions.",
    details: [
      "Screen capture is strictly bound to the active tab or approved window; whole-desktop capture is disallowed.",
      "Capture is targeted to terminate when the child exits the lesson or when the guardian revokes permission.",
      "Policy targets in-memory learning extraction without persistent raw screen recordings.",
    ],
  },
];

export function CapturePolicyBanner({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 shadow-xs",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-snow-primary-dark">
              Device Capture & Privacy Policy
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-snow-muted">
              Policy target: sensitive capture remains unavailable until backend consent/grant enforcement is verified.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="snow-focus-ring flex items-center justify-between gap-1.5 self-start rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-3 py-1.5 text-xs font-black text-snow-primary-dark transition hover:bg-snow-lavender/50 sm:self-center"
        >
          <span>{isExpanded ? "Hide policy details" : "Review capture governance"}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-snow-border/80 bg-snow-surface-soft/80 p-3.5">
        <div className="flex items-start gap-2.5">
          <Lock className="mt-0.5 size-4 shrink-0 text-snow-primary" />
          <p className="text-xs font-semibold leading-5 text-snow-primary-dark">
            <strong>Policy target:</strong> Sensitive capture remains unavailable until backend consent/grant enforcement is verified. Hardware streams require explicit guardian authorization before activation.
          </p>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 grid gap-3 pt-2 sm:grid-cols-2 snow-enter-soft">
          {capturePolicies.map((policy) => {
            const Icon = policy.icon;
            return (
              <div
                key={policy.title}
                className="rounded-[var(--radius-md)] border border-snow-border bg-white p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-md bg-snow-primary-soft text-snow-primary">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="text-xs font-black text-snow-primary-dark">{policy.title}</h3>
                  </div>
                  <span className="rounded-full bg-snow-surface-soft px-2 py-0.5 text-[10px] font-bold text-snow-muted">
                    {policy.badge}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-snow-muted">{policy.summary}</p>
                <ul className="mt-2.5 space-y-1.5 border-t border-snow-border/60 pt-2 text-[11px] leading-4 text-snow-primary-dark/80">
                  {policy.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-snow-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
