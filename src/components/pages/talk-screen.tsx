"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Cloud, Flame, Heart, Leaf, Mic, MonitorPlay, Moon, Send, Sparkles, Star } from "lucide-react";

type Mood = "Happy" | "Worried" | "Angry" | "Excited" | "Sleepy";

type Message = {
  id: string;
  sender: "Minh" | "AgentKid";
  text: string;
  time: string;
  isAction?: boolean;
};

const moodData = [
  { label: "Happy", icon: Star, bg: "bg-snow-warning/20", color: "text-snow-warning" },
  { label: "Worried", icon: Cloud, bg: "bg-snow-aqua/20", color: "text-snow-aqua" },
  { label: "Angry", icon: Flame, bg: "bg-snow-peach/30", color: "text-snow-danger" },
  { label: "Excited", icon: Sparkles, bg: "bg-snow-success/20", color: "text-snow-success" },
  { label: "Sleepy", icon: Moon, bg: "bg-snow-primary/20", color: "text-snow-primary" },
] satisfies Array<{ label: Mood; icon: typeof Star; bg: string; color: string }>;

export function TalkScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "Minh", text: "I felt worried about my math test today.", time: "9:15 AM" },
    { id: "2", sender: "AgentKid", text: "It's okay to feel worried sometimes. Want to tell me what was on your mind?", time: "9:15 AM" },
    { id: "3", sender: "Minh", text: "I was afraid I might not do well.", time: "9:16 AM" },
    { id: "4", sender: "AgentKid", text: "You studied hard and did your best. That's what matters most. Would you like to try a breathing exercise together?", time: "9:16 AM", isAction: true },
  ]);
  const [inputText, setInputText] = useState("");

  const handleMoodSelect = (mood: Mood) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "Minh",
        text: `I feel ${mood.toLowerCase()}.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "Minh",
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputText("");
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <header className="z-10 mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-4xl font-black text-snow-primary-dark">
            Talk with AgentKid <Sparkles className="size-6 text-snow-primary" />
          </h1>
          <p className="mt-2 text-base font-bold text-snow-muted">Your safe space to share, feel, and grow.</p>
        </div>
        <Link href="/companion/avatar" className="snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-sm font-black text-snow-primary-dark transition hover:bg-snow-surface-soft">
          <MonitorPlay className="size-4 text-snow-primary" />
          Avatar mode
        </Link>
      </header>

      <div className="-mr-10 absolute right-0 top-0 z-0 hidden lg:block">
        <Image src="/images/snow-mascot.png" alt="" width={160} height={160} className="opacity-90 drop-shadow-lg" />
      </div>

      <div className="z-10 flex min-h-0 flex-1 flex-col rounded-[var(--radius-xl)] border border-snow-border bg-white p-6 shadow-sm">
        <div className="mb-8 shrink-0">
          <h2 className="mb-1 text-xl font-black text-snow-primary-dark">How are you feeling today?</h2>
          <p className="mb-4 text-sm font-semibold text-snow-muted">Pick a feeling or talk to AgentKid.</p>
          <div className="flex flex-wrap gap-4">
            {moodData.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.label}
                  onClick={() => handleMoodSelect(m.label)}
                  className={`flex h-28 w-24 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-white/50 p-4 shadow-sm transition-transform hover:-translate-y-1 ${m.bg}`}
                >
                  <Icon className={`mb-2 size-9 ${m.color}`} />
                  <span className={`text-sm font-black ${m.color}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="snow-scrollbar mb-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === "Minh" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "AgentKid" && (
                <div className="mt-1 shrink-0">
                  <div className="grid size-10 place-items-center rounded-full border-2 border-snow-surface bg-snow-ice">
                    <Image src="/images/snow-avatar-final.png" alt="AgentKid" width={32} height={32} />
                  </div>
                </div>
              )}
              <div className={`flex max-w-[70%] flex-col ${msg.sender === "Minh" ? "items-end" : "items-start"}`}>
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="text-xs font-black text-snow-primary-dark">{msg.sender}</span>
                  <span className="text-[10px] font-bold text-snow-muted">{msg.time}</span>
                </div>
                <div className={`rounded-2xl p-4 text-sm font-semibold leading-relaxed shadow-sm ${msg.sender === "Minh" ? "rounded-tr-sm bg-snow-lavender text-snow-primary-dark" : "rounded-tl-sm border border-snow-border bg-snow-surface text-snow-primary-dark"}`}>
                  {msg.text}
                </div>
                {msg.isAction && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 rounded-full border border-snow-success/20 bg-snow-success/10 px-4 py-2 text-xs font-bold text-snow-success">
                      <Leaf className="size-4" /> Yes, let&apos;s try
                    </button>
                    <button className="flex items-center gap-2 rounded-full border border-snow-aqua/20 bg-snow-aqua/10 px-4 py-2 text-xs font-bold text-snow-aqua">
                      <BookOpen className="size-4" /> Tell me a calm story
                    </button>
                    <button className="flex items-center gap-2 rounded-full border border-snow-peach/20 bg-snow-peach/10 px-4 py-2 text-xs font-bold text-snow-peach">
                      <Heart className="size-4" /> I need more help
                    </button>
                  </div>
                )}
              </div>
              {msg.sender === "Minh" && (
                <div className="mt-1 shrink-0">
                  <div className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-snow-surface bg-snow-ice">
                    <Image src="/images/snow-avatar-final.png" alt="Minh" width={40} height={40} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-full border border-snow-border bg-snow-surface p-2 shadow-sm">
          <button className="grid size-12 shrink-0 place-items-center rounded-full bg-snow-primary text-white shadow-sm">
            <Mic className="size-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tap to talk with AgentKid..."
            className="min-w-0 flex-1 bg-transparent px-4 py-2 text-base font-semibold text-snow-primary-dark outline-none placeholder:text-snow-muted/60"
          />
          <button onClick={handleSend} className="grid size-12 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary">
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
