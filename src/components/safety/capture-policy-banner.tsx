"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, Eye, Lock, Mic, Monitor, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, tUnchecked } from "@/i18n";

export function CapturePolicyBanner({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const capturePolicies = [
    {
      icon: Mic,
      title: t("parent", "safety.capturePolicy.policies.microphone.title"),
      badge: t("parent", "safety.capturePolicy.policies.microphone.badge"),
      summary: t("parent", "safety.capturePolicy.policies.microphone.summary"),
      details: [
        tUnchecked("parent", "safety.capturePolicy.policies.microphone.details.0"),
        tUnchecked("parent", "safety.capturePolicy.policies.microphone.details.1"),
        tUnchecked("parent", "safety.capturePolicy.policies.microphone.details.2"),
      ],
    },
    {
      icon: Camera,
      title: t("parent", "safety.capturePolicy.policies.camera.title"),
      badge: t("parent", "safety.capturePolicy.policies.camera.badge"),
      summary: t("parent", "safety.capturePolicy.policies.camera.summary"),
      details: [
        tUnchecked("parent", "safety.capturePolicy.policies.camera.details.0"),
        tUnchecked("parent", "safety.capturePolicy.policies.camera.details.1"),
        tUnchecked("parent", "safety.capturePolicy.policies.camera.details.2"),
      ],
    },
    {
      icon: Eye,
      title: t("parent", "safety.capturePolicy.policies.vision.title"),
      badge: t("parent", "safety.capturePolicy.policies.vision.badge"),
      summary: t("parent", "safety.capturePolicy.policies.vision.summary"),
      details: [
        tUnchecked("parent", "safety.capturePolicy.policies.vision.details.0"),
        tUnchecked("parent", "safety.capturePolicy.policies.vision.details.1"),
        tUnchecked("parent", "safety.capturePolicy.policies.vision.details.2"),
      ],
    },
    {
      icon: Monitor,
      title: t("parent", "safety.capturePolicy.policies.screen.title"),
      badge: t("parent", "safety.capturePolicy.policies.screen.badge"),
      summary: t("parent", "safety.capturePolicy.policies.screen.summary"),
      details: [
        tUnchecked("parent", "safety.capturePolicy.policies.screen.details.0"),
        tUnchecked("parent", "safety.capturePolicy.policies.screen.details.1"),
        tUnchecked("parent", "safety.capturePolicy.policies.screen.details.2"),
      ],
    },
  ];

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
              {t("parent", "safety.capturePolicy.title")}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-snow-muted">
              {t("parent", "safety.capturePolicy.subtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="snow-focus-ring flex items-center justify-between gap-1.5 self-start rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-3 py-1.5 text-xs font-black text-snow-primary-dark transition hover:bg-snow-lavender/50 sm:self-center"
        >
          <span>{isExpanded ? t("parent", "safety.capturePolicy.hideDetails") : t("parent", "safety.capturePolicy.showDetails")}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-snow-border/80 bg-snow-surface-soft/80 p-3.5">
        <div className="flex items-start gap-2.5">
          <Lock className="mt-0.5 size-4 shrink-0 text-snow-primary" />
          <p className="text-xs font-semibold leading-5 text-snow-primary-dark">
            <strong>{t("parent", "safety.capturePolicy.bannerNoteTitle")}</strong>{" "}
            {t("parent", "safety.capturePolicy.bannerNoteDesc")}
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
