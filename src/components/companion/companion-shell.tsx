"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Bot,
  ChevronDown,
  Globe2,
  Lock,
  Mic,
  Pause,
  Save,
  Send,
  Shield,
  SlidersHorizontal,
  Smile,
  Snowflake,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import type { CompanionState } from "@/types/snow";
import { SnowButton } from "@/components/ui/snow-button";
import { cn } from "@/lib/utils";
import { t, type NamespaceKey } from "@/i18n";

type TabKey = "General" | "Live2D" | "ASR" | "TTS" | "Agent" | "About";

const tabs: readonly TabKey[] = ["General", "Live2D", "ASR", "TTS", "Agent", "About"];

const tabLabelKeyMap: Record<TabKey, NamespaceKey<"companion">> = {
  General: "shell.tabs.general",
  Live2D: "shell.tabs.live2d",
  ASR: "shell.tabs.asr",
  TTS: "shell.tabs.tts",
  Agent: "shell.tabs.agent",
  About: "shell.tabs.about",
};

const tabFields: Record<TabKey, string[]> = {
  General: ["Language", "Show Subtitle", "Child Safe Mode", "Calm Voice", "Parent Access", "Background Scene", "Character Preset", "WebSocket URL", "Base URL"],
  Live2D: ["Model preset", "Scale", "Position X", "Position Y", "Eye tracking", "Idle motion", "Touch interaction"],
  ASR: ["Provider", "Language", "Voice activity detection", "Silence threshold", "Wake word optional"],
  TTS: ["Provider", "Voice", "Speed", "Pitch", "Emotion tone"],
  Agent: ["Persona", "Safety profile", "Child age mode", "Lesson context", "Memory mode"],
  About: ["Version", "Source base", "Privacy notes", "Safety disclaimer"],
};

const fieldLabelKeyMap: Record<string, NamespaceKey<"companion">> = {
  Language: "shell.fields.language",
  "Show Subtitle": "shell.fields.showSubtitle",
  "Child Safe Mode": "shell.fields.childSafeMode",
  "Calm Voice": "shell.fields.calmVoice",
  "Parent Access": "shell.fields.parentAccess",
  "Background Scene": "shell.fields.backgroundScene",
  "Character Preset": "shell.fields.characterPreset",
  "WebSocket URL": "shell.fields.webSocketUrl",
  "Base URL": "shell.fields.baseUrl",
  "Model preset": "shell.fields.modelPreset",
  Scale: "shell.fields.scale",
  "Position X": "shell.fields.positionX",
  "Position Y": "shell.fields.positionY",
  "Eye tracking": "shell.fields.eyeTracking",
  "Idle motion": "shell.fields.idleMotion",
  "Touch interaction": "shell.fields.touchInteraction",
  Provider: "shell.fields.provider",
  "Voice activity detection": "shell.fields.voiceActivityDetection",
  "Silence threshold": "shell.fields.silenceThreshold",
  "Wake word optional": "shell.fields.wakeWordOptional",
  Voice: "shell.fields.voice",
  Speed: "shell.fields.speed",
  Pitch: "shell.fields.pitch",
  "Emotion tone": "shell.fields.emotionTone",
  Persona: "shell.fields.persona",
  "Safety profile": "shell.fields.safetyProfile",
  "Child age mode": "shell.fields.childAgeMode",
  "Lesson context": "shell.fields.lessonContext",
  "Memory mode": "shell.fields.memoryMode",
  Version: "shell.fields.version",
  "Source base": "shell.fields.sourceBase",
  "Privacy notes": "shell.fields.privacyNotes",
  "Safety disclaimer": "shell.fields.safetyDisclaimer",
};

export function CompanionShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("General");
  const [state, setState] = useState<CompanionState>("listening");
  const connected = state !== "connection-lost";

  const subtitle = useMemo(() => {
    if (state === "listening") return t("companion", "shell.subtitles.listening");
    if (state === "thinking") return t("companion", "shell.subtitles.thinking");
    if (state === "speaking") return t("companion", "shell.subtitles.speaking");
    if (state === "connection-lost") return t("companion", "shell.subtitles.connectionLost");
    return t("companion", "shell.subtitles.default");
  }, [state]);

  return (
    <div className="snow-page-bg h-[100dvh] overflow-hidden text-snow-foreground">
      <div className="flex h-full flex-col overflow-hidden bg-snow-surface/92">
        <header className="flex min-h-20 shrink-0 items-center justify-between border-b border-snow-border bg-snow-surface/78 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-3xl font-black text-snow-primary">
            <Snowflake className="size-9" />
            AgentKid
          </div>
          <div className="hidden rounded-full border border-snow-border bg-snow-primary-soft px-10 py-3 text-center md:block">
            <p className="text-sm font-black text-snow-primary">{t("companion", "shell.aiCompanion")}</p>
            <p className="text-xs font-bold text-snow-muted">{t("companion", "shell.buddySubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label={t("companion", "shell.helpAria")} className="grid size-11 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-primary-dark">?</button>
            <button aria-label={t("companion", "shell.childMode")} className="flex min-h-12 items-center gap-3 rounded-full border border-snow-border bg-snow-surface px-3">
              <Image src="/images/snow-avatar-v2.png" alt="" aria-hidden="true" width={38} height={38} className="rounded-full" />
              <span className="hidden text-left leading-tight sm:block">
                <strong className="block text-sm font-black text-snow-primary-dark">Minh</strong>
                <span className="text-xs font-bold text-snow-muted">{t("companion", "shell.childMode")}</span>
              </span>
              <ChevronDown className="size-4" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          <CompanionSettingsPanel activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
            <CompanionStage state={state} connected={connected} subtitle={subtitle} />
            <BottomControlBar state={state} setState={setState} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanionSettingsPanel({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}) {
  return (
    <aside className="snow-scrollbar flex min-h-0 flex-col overflow-y-auto rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <SlidersHorizontal className="mt-1 size-6 text-snow-primary" />
          <div>
            <h1 className="text-2xl font-black text-snow-primary">{t("companion", "shell.title")}</h1>
            <p className="mt-1 text-sm font-bold text-snow-muted">{t("companion", "shell.subtitle")}</p>
          </div>
        </div>
        <button aria-label={t("companion", "shell.closeSettings")} className="grid size-11 place-items-center rounded-full text-snow-primary-dark"><X className="size-5" /></button>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-1 border-b border-snow-border xl:grid-cols-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={cn(
              "min-h-11 border-b-2 px-2 text-sm font-black transition",
              activeTab === tab ? "border-snow-primary text-snow-primary" : "border-transparent text-snow-primary-dark",
            )}
          >
            {t("companion", tabLabelKeyMap[tab])}
          </button>
        ))}
      </div>
      <div className="mt-6 flex-1 space-y-5 pr-1">
        {tabFields[activeTab].map((field) => <SettingField key={field} label={field} tab={activeTab} />)}
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-snow-border pt-5">
        <SnowButton variant="ghost">{t("common", "cancel")}</SnowButton>
        <SnowButton><Save className="size-4" /> {t("common", "save")}</SnowButton>
      </div>
    </aside>
  );
}

function SettingField({ label, tab }: { label: string; tab: TabKey }) {
  const switchLabels = ["Show Subtitle", "Child Safe Mode", "Calm Voice", "Parent Access", "Eye tracking", "Idle motion", "Touch interaction", "Voice activity detection", "Wake word optional", "Memory mode"];
  const selectLabels = ["Language", "Background Scene", "Character Preset", "Provider", "Voice", "Persona", "Safety profile", "Child age mode", "Lesson context", "Version", "Source base", "Privacy notes"];
  const iconMap: Record<string, React.ElementType> = {
    Language: Globe2,
    "Show Subtitle": Bot,
    "Child Safe Mode": Shield,
    "Calm Voice": Volume2,
    "Parent Access": Lock,
  };
  const Icon = iconMap[label] ?? Smile;
  const isSwitch = switchLabels.includes(label);
  const isSelect = selectLabels.includes(label);
  const isUrl = label.includes("URL");
  const fieldKey = fieldLabelKeyMap[label];
  const renderedLabel = fieldKey ? t("companion", fieldKey) : label;

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-3 text-sm font-black text-snow-primary-dark">
        <Icon className="size-5 text-snow-primary" />
        {renderedLabel}
      </span>
      {isSwitch ? (
        <button type="button" role="switch" aria-checked="true" className="flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md)] bg-snow-surface-soft px-4 text-left">
          <span className="text-sm font-semibold text-snow-muted">{label === "Parent Access" ? t("companion", "shell.requireParentVerification") : t("companion", "shell.enabled")}</span>
          <span className="relative h-7 w-12 rounded-full bg-snow-primary"><span className="absolute right-1 top-1 size-5 rounded-full bg-snow-surface" /></span>
        </button>
      ) : (
        <button type="button" className="flex min-h-11 w-full items-center rounded-[var(--radius-md)] border border-snow-border bg-snow-surface px-4 text-sm font-bold text-snow-muted">
          <span className="min-w-0 flex-1 truncate text-left">
            {isUrl ? (label === "WebSocket URL" ? "ws://127.0.0.1:12393/client-ws" : "http://127.0.0.1:12393") : defaultValue(label, tab)}
          </span>
          {isSelect ? <ChevronDown className="size-4 shrink-0 text-snow-primary-dark" /> : null}
        </button>
      )}
    </label>
  );
}

function defaultValue(label: string, tab: TabKey) {
  if (label === "Background Scene") return t("companion", "shell.defaults.backgroundScene");
  if (label === "Character Preset") return t("companion", "shell.defaults.characterPreset");
  if (label === "Provider") return tab === "ASR" ? t("companion", "shell.defaults.browserVoice") : t("companion", "shell.defaults.gentleVoice");
  if (label === "Version") return t("companion", "shell.defaults.version");
  if (label === "Safety disclaimer") return t("companion", "shell.defaults.safetyDisclaimer");
  return t("companion", "shell.defaults.default");
}

function CompanionStage({
  state,
  connected,
  subtitle,
}: {
  state: CompanionState;
  connected: boolean;
  subtitle: string;
}) {
  return (
    <section className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-snow-border bg-gradient-to-br from-snow-ice via-snow-surface-soft to-snow-lavender shadow-[var(--shadow-stage)]">
      <Image
        src="/images/snow-classroom-empty-stage-v2.png"
        alt={t("companion", "shell.stageAlt")}
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-snow-surface/10 via-transparent to-snow-primary-dark/12" />
      <div className={cn("absolute left-6 top-6 z-10 flex min-h-11 items-center gap-2 rounded-full bg-snow-surface px-5 text-sm font-black shadow-[var(--shadow-card)]", connected ? "text-snow-success" : "text-snow-danger")}>
        {connected ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
        {connected ? t("companion", "session.connected") : t("companion", "session.disconnected")}
      </div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-20 z-10 mx-auto hidden h-48 w-48 rounded-full bg-snow-surface/25 blur-3xl lg:block"
        animate={{ scale: state === "listening" ? [0.95, 1.05, 0.95] : [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute bottom-6 left-1/2 z-20 w-[86%] -translate-x-1/2 rounded-[var(--radius-full)] border border-snow-surface/70 bg-snow-primary-dark/75 px-6 py-4 text-center shadow-[var(--shadow-stage)] backdrop-blur md:px-8 md:py-5">
        <p className="text-lg font-black text-white md:text-2xl">{subtitle}</p>
      </div>
    </section>
  );
}

function BottomControlBar({
  state,
  setState,
}: {
  state: CompanionState;
  setState: (state: CompanionState) => void;
}) {
  const stateCopy: Record<CompanionState, string> = {
    idle: t("companion", "state.idle"),
    listening: t("companion", "state.listening"),
    thinking: t("companion", "state.thinking"),
    speaking: t("companion", "state.speaking"),
    interrupted: t("companion", "state.interrupted"),
    "connection-lost": t("companion", "state.error"),
  };

  return (
    <section className="shrink-0 rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-snow-primary-soft px-5 text-sm font-black text-snow-primary">
            <span className="size-2 rounded-full bg-snow-primary" />
            {stateCopy[state]}
          </span>
          <button aria-label={t("companion", "shell.toggleMic")} onClick={() => setState(state === "listening" ? "idle" : "listening")} className="grid size-14 place-items-center rounded-full bg-snow-primary text-white shadow-[var(--shadow-card)]">
            <Mic className="size-7" />
          </button>
          <button aria-label={t("companion", "shell.muteAgentKid")} onClick={() => setState("interrupted")} className="grid size-14 place-items-center rounded-full bg-snow-ice text-snow-primary">
            <Volume2 className="size-7" />
          </button>
        </div>
        <div className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-lg)] border border-snow-border px-5">
          <input className="min-w-0 flex-1 bg-transparent text-lg font-bold text-snow-primary-dark outline-none placeholder:text-snow-muted" placeholder={t("companion", "shell.typeMessage")} />
          <button aria-label={t("companion", "shell.openEmojiPicker")} className="grid size-11 place-items-center rounded-full text-snow-muted"><Smile className="size-6" /></button>
        </div>
        <button aria-label={t("companion", "talk.sendAria")} onClick={() => setState("speaking")} className="grid size-16 place-items-center rounded-full bg-snow-primary text-white shadow-[var(--shadow-card)]">
          <Send className="size-7 fill-white" />
        </button>
        <button aria-label={t("companion", "shell.stopAgentKid")} onClick={() => setState("interrupted")} className="grid size-16 place-items-center rounded-full bg-snow-danger text-white shadow-[var(--shadow-card)]">
          <Pause className="size-7 fill-white" />
        </button>
      </div>
      <p className="mt-3 text-center text-xs font-bold text-snow-muted">{t("companion", "shell.footerDisclaimer")}</p>
    </section>
  );
}
