"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bot, Cpu, Database, Network, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { mockAdminSettings, mockAdminStats } from "@/data";
import { cn } from "@/lib/utils";

type AdminView = "dashboard" | "companion" | "vision" | "system";

export function AdminDashboardScreen({ view = "dashboard" }: { view?: AdminView }) {
  const [toggles, setToggles] = useState({
    semanticCache: true,
    subtitleOverlay: true,
    cameraPreview: false,
    safetyMirror: true,
    autoReconnect: true,
    quietLogging: false,
  });

  function toggle(key: keyof typeof toggles) {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  }

  const sections: Record<AdminView, ReactNode> = {
    dashboard: (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Active sessions" value={`${mockAdminStats.activeSessions}`} detail="Child and parent surfaces" icon={<Bot className="size-5 text-snow-primary-dark" />} tone="bg-snow-primary-soft" />
          <AdminStatCard label="Connected users" value={`${mockAdminStats.connectedUsers}`} detail="Current estimated connections" icon={<Network className="size-5 text-snow-primary-dark" />} tone="bg-snow-ice" />
          <AdminStatCard label="Average latency" value={`${mockAdminStats.avgLatencyMs} ms`} detail="Companion response loop" icon={<Cpu className="size-5 text-snow-primary-dark" />} tone="bg-snow-lavender" />
          <AdminStatCard label="Uptime" value={mockAdminStats.serverUptime} detail="No current outage detected" icon={<ShieldCheck className="size-5 text-snow-primary-dark" />} tone="bg-snow-cream" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Runtime snapshot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MetricRow label="Live2D model" value={mockAdminSettings.live2dModel} />
              <MetricRow label="ASR provider" value={mockAdminSettings.asrProvider} />
              <MetricRow label="TTS provider" value={mockAdminSettings.ttsProvider} />
              <MetricRow label="LLM provider" value={mockAdminSettings.llmProvider} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <MetricRow label="Websocket bridge" value="Connected" />
              <MetricRow label="Subtitle overlay" value={toggles.subtitleOverlay ? "Enabled" : "Disabled"} />
              <MetricRow label="Safety mirror" value={toggles.safetyMirror ? "Enabled" : "Disabled"} />
            </div>
          </SnowCard>
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Safety posture</h2>
            <div className="mt-4 space-y-3">
              {[
                "Parent-only emergency controls remain isolated from child UI.",
                "Camera preview defaults to off and requires explicit parent review.",
                "Observation summaries remain non-clinical.",
              ].map((item) => (
                <div key={item} className="snow-body-copy snow-font-readable rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 font-semibold text-snow-primary-dark">
                  {item}
                </div>
              ))}
            </div>
          </SnowCard>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">System watchlist</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MetricRow label="Transcript queue" value="Healthy" />
              <MetricRow label="Alert delivery" value="1 review item" />
              <MetricRow label="Vision review" value="Idle" />
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ["08:42", "Prompt profile reloaded for child-safe companion wrapper"],
                ["09:05", "Parent review note delivered to portal alert queue"],
                ["09:28", "Vision review remained off for everyday child flow"],
              ].map(([time, detail]) => (
                <div key={time} className="flex gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
                  <span className="snow-font-mono text-xs font-black text-snow-primary">{time}</span>
                  <p className="snow-body-small snow-font-readable font-semibold text-snow-primary-dark">{detail}</p>
                </div>
              ))}
            </div>
          </SnowCard>
          <SnowCard className="snow-card-pad">
            <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Operator note</h2>
            <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">Admin screens support supervision and runtime review. They should feel denser than child UI, but still calm and trustworthy.</p>
            <div className="mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
              <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Current review</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">No child-facing technical controls have leaked into the session shell.</p>
            </div>
          </SnowCard>
        </div>
      </>
    ),
    companion: (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Companion controls</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MetricRow label="Live2D model" value={mockAdminSettings.live2dModel} />
            <MetricRow label="ASR provider" value={mockAdminSettings.asrProvider} />
            <MetricRow label="TTS voice" value={mockAdminSettings.ttsProvider} />
            <MetricRow label="Prompt profile" value="AgentKid calm companion" />
          </div>
          <div className="mt-5 grid gap-3">
            <ToggleRow label="Subtitle overlay" enabled={toggles.subtitleOverlay} onToggle={() => toggle("subtitleOverlay")} />
            <ToggleRow label="Auto reconnect" enabled={toggles.autoReconnect} onToggle={() => toggle("autoReconnect")} />
            <ToggleRow label="Safety mirror" enabled={toggles.safetyMirror} onToggle={() => toggle("safetyMirror")} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <MetricRow label="Current bridge" value="Open LLM VTuber wrapper" />
            <MetricRow label="Route status" value="Connected" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricRow label="WS fallback" value="Enabled" />
            <MetricRow label="Child subtitle copy" value="Safe" />
            <MetricRow label="Reconnect state" value={toggles.autoReconnect ? "Automatic" : "Manual"} />
          </div>
        </SnowCard>
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Prompt guardrail</h2>
          <p className="snow-body-copy snow-font-readable mt-3 rounded-[var(--radius-md)] bg-snow-surface-soft p-4 font-semibold text-snow-muted">
            {mockAdminSettings.systemPrompt}
          </p>
          <div className="snow-body-copy snow-font-readable mt-4 rounded-[var(--radius-md)] bg-snow-primary-soft p-4 font-semibold text-snow-primary-dark">
            Child UI never exposes these technical controls directly.
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
            <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Visible wrapper status</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Background art, subtitle copy, and reconnect button should remain child-safe even when the technical runtime is disconnected.</p>
          </div>
        </SnowCard>
      </div>
    ),
    vision: (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Vision policy</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MetricRow label="Preview mode" value="Parent review only" />
            <MetricRow label="Default camera state" value="Off" />
            <MetricRow label="Vision AI access" value="Disabled for daily sessions" />
            <MetricRow label="Review retention" value="30 days" />
          </div>
          <div className="mt-5 grid gap-3">
            <ToggleRow label="Camera preview" enabled={toggles.cameraPreview} onToggle={() => toggle("cameraPreview")} />
            <ToggleRow label="Quiet logging" enabled={toggles.quietLogging} onToggle={() => toggle("quietLogging")} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <MetricRow label="Parent review path" value="/parent/privacy" />
            <MetricRow label="Child exposure" value="Blocked" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricRow label="Default state" value="Preview off" />
            <MetricRow label="Vision queue" value="0 pending" />
            <MetricRow label="Policy mode" value="Parent supervised" />
          </div>
        </SnowCard>
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Review note</h2>
          <p className="snow-body-copy snow-font-readable mt-3 font-semibold text-snow-muted">
            Vision controls exist for parent-supervised use only. Child-facing surfaces should never expose raw camera tooling or technical video settings.
          </p>
          <div className="snow-body-copy snow-font-readable mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4 font-semibold text-snow-primary-dark">
            Preview remains off by default in AgentKid-owned flows.
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] bg-snow-primary-soft p-4">
            <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Audit note</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Vision settings exist for review and policy control, not daily child-facing interaction.</p>
          </div>
        </SnowCard>
      </div>
    ),
    system: (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">System services</h2>
          <div className="mt-4 grid gap-3">
            <ServiceRow title="Companion websocket" detail="Healthy" tone="ok" />
            <ServiceRow title="Transcript store" detail="No write backlog" tone="ok" />
            <ServiceRow title="Parent alerts queue" detail="1 low-priority review item" tone="warn" />
            <ServiceRow title="Vision review channel" detail="Idle" tone="idle" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <MetricRow label="Memory usage" value={mockAdminStats.memoryUsage} />
            <MetricRow label="Deploy mode" value="UI prototype" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricRow label="Audit trail" value="Updated today" />
            <MetricRow label="Companion route" value="/companion" />
            <MetricRow label="Operator lock" value="Enabled" />
          </div>
        </SnowCard>
        <SnowCard className="snow-card-pad">
          <h2 className="snow-heading text-[1.1rem] font-black text-snow-primary-dark">Operator actions</h2>
          <div className="mt-4 space-y-3">
            <SnowButton variant="soft" className="w-full justify-center">
              <SlidersHorizontal className="size-4" />
              Review thresholds
            </SnowButton>
            <SnowButton variant="ghost" className="w-full justify-center">
              <Database className="size-4" />
              Flush cache
            </SnowButton>
          </div>
          <div className="snow-body-copy snow-font-readable mt-4 rounded-[var(--radius-md)] bg-snow-surface-soft p-4 font-semibold text-snow-muted">
            This panel is still demo-grade, but it no longer reads like a placeholder.
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] bg-snow-primary-soft p-4">
            <p className="text-xs font-black uppercase tracking-wide text-snow-muted">Runbook note</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Any system-facing change should preserve calm child copy, parent-only safety controls, and wrapper isolation.</p>
          </div>
        </SnowCard>
      </div>
    ),
  };

  return (
    <div className="snow-font-ui mx-auto max-w-[var(--page-max)] space-y-[var(--section-gap)]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-snow-primary">AgentKid Pro</p>
          <h1 className="snow-title-compact mt-2 font-black text-snow-primary-dark">
            {view === "dashboard" ? "System overview" : view === "companion" ? "Companion runtime" : view === "vision" ? "Vision controls" : "System operations"}
          </h1>
          <p className="snow-body-copy snow-font-readable mt-2 max-w-[760px] font-semibold text-snow-muted">
            {view === "dashboard"
              ? "Monitor the shared AgentKid runtime, review calm-safety posture, and keep core technical settings parent-safe."
              : view === "companion"
                ? "Adjust the companion wrapper runtime, prompt profile, and response behavior without exposing technical settings in child UI."
                : view === "vision"
                  ? "Review camera and visual understanding controls. Preview remains off by default and parent-governed."
                  : "Check service health, cache posture, and operator-only controls for the AgentKid technical environment."}
          </p>
        </div>
        <SnowButton><ShieldCheck className="size-4" /> Apply review</SnowButton>
      </header>
      {sections[view]}
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <SnowCard className="snow-card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">{label}</p>
          <p className="mt-3 text-[clamp(1.45rem,1.55vw,1.8rem)] font-black leading-tight text-snow-primary-dark">{value}</p>
          <p className="snow-body-small snow-font-readable mt-2 font-semibold text-snow-muted">{detail}</p>
        </div>
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-full", tone)}>
          {icon}
        </div>
      </div>
    </SnowCard>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-snow-muted">{label}</p>
      <p className={cn("mt-1 text-sm font-black text-snow-primary-dark", /provider|model|queue|path|mode|cache/i.test(label) && "snow-font-mono text-[13px]")}>{value}</p>
    </div>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
      <p className="text-sm font-black text-snow-primary-dark">{label}</p>
      <button
        type="button"
        aria-label={`Toggle ${label}`}
        aria-pressed={enabled}
        onClick={onToggle}
        className={cn("snow-focus-ring relative h-6 w-12 shrink-0 rounded-full transition-colors", enabled ? "bg-snow-success" : "bg-snow-border")}
      >
        <span className={cn("absolute top-1 size-4 rounded-full bg-white transition-transform", enabled ? "translate-x-7" : "translate-x-1")} />
      </button>
    </div>
  );
}

function ServiceRow({ title, detail, tone }: { title: string; detail: string; tone: "ok" | "warn" | "idle" }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-snow-primary-dark">{title}</p>
        <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{detail}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-black",
          tone === "ok" && "bg-snow-success/15 text-snow-success",
          tone === "warn" && "bg-snow-warning/15 text-snow-warning",
          tone === "idle" && "bg-snow-primary-soft text-snow-primary-dark",
        )}
      >
        {tone === "ok" ? "Healthy" : tone === "warn" ? "Review" : "Idle"}
      </span>
    </div>
  );
}
