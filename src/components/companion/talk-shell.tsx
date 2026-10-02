"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  AlertCircle,
  BookOpen,
  Cloud,
  Flame,
  Heart,
  Leaf,
  Loader2,
  Mic,
  Moon,
  RefreshCw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import {
  createSession,
  getSession,
  getMessages,
  sendMessage,
  CompanionApiError,
} from "@/lib/companion-client";
import type { CompanionMessage } from "@/lib/companion-client";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mood = "Happy" | "Worried" | "Angry" | "Excited" | "Sleepy";

type MessageStatus = "pending" | "sent" | "error";

type OptimisticMessage = CompanionMessage & {
  _status?: MessageStatus;
  _error?: string;
  _clientKey?: string;
};

const moodData = [
  { label: "Happy" as Mood, icon: Star, bg: "bg-snow-warning/20", color: "text-snow-warning" },
  { label: "Worried" as Mood, icon: Cloud, bg: "bg-snow-aqua/20", color: "text-snow-aqua" },
  { label: "Angry" as Mood, icon: Flame, bg: "bg-snow-peach/30", color: "text-snow-danger" },
  { label: "Excited" as Mood, icon: Sparkles, bg: "bg-snow-success/20", color: "text-snow-success" },
  { label: "Sleepy" as Mood, icon: Moon, bg: "bg-snow-primary/20", color: "text-snow-primary" },
];

const SESSION_STORAGE_KEY = "companion:sessionId";
const POLL_INTERVAL_MS = 3000;
const SEND_TIMEOUT_MS = 30000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseApiError(e: unknown): string {
  if (e instanceof CompanionApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TalkShell({ childId }: { childId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // clientMessageId map: key → UUID. Never regenerated.
  const clientIdMapRef = useRef<Map<string, string>>(new Map());
  // Last seen message ID for polling afterId
  const lastMsgIdRef = useRef<string | undefined>(undefined);
  // Poll interval handle
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Message list scroll ref
  const listRef = useRef<HTMLDivElement>(null);

  // ── Session init ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      setSessionLoading(true);
      setSessionError(null);

      const stored =
        typeof window !== "undefined"
          ? sessionStorage.getItem(SESSION_STORAGE_KEY)
          : null;

      try {
        let sess;
        if (stored) {
          try {
            sess = await getSession(stored);
          } catch (e) {
            // Stale / unauthorized session — create fresh one
            if (
              e instanceof CompanionApiError &&
              (e.status === 404 || e.status === 401)
            ) {
              sess = await createSession(childId);
            } else {
              throw e;
            }
          }
        } else {
          sess = await createSession(childId);
        }

        if (!cancelled) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, sess.id);
          setSessionId(sess.id);
          // Load existing messages
          const existing = await getMessages(sess.id);
          if (!cancelled) {
            setMessages(existing);
            if (existing.length > 0) {
              lastMsgIdRef.current = existing[existing.length - 1].id;
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setSessionError(parseApiError(e));
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, [childId]);

  // ── Polling ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const newMsgs = await getMessages(sessionId, lastMsgIdRef.current);
        if (newMsgs.length > 0) {
          lastMsgIdRef.current = newMsgs[newMsgs.length - 1].id;
          setMessages((prev) => {
            // Avoid duplicates by id
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch {
        // Poll errors are silent — UI will recover on next interval
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [sessionId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Send ─────────────────────────────────────────────────────────────────

  const doSend = useCallback(
    async (content: string, clientKey: string) => {
      if (!sessionId) return;

      // Get or create stable clientMessageId for this key
      if (!clientIdMapRef.current.has(clientKey)) {
        clientIdMapRef.current.set(clientKey, crypto.randomUUID());
      }
      const clientMessageId = clientIdMapRef.current.get(clientKey)!;

      // Optimistic bubble
      const optimisticId = `opt-${clientKey}`;
      const optimistic: OptimisticMessage = {
        id: optimisticId,
        clientMessageId,
        sessionId,
        role: "child",
        content,
        createdAt: new Date().toISOString(),
        _status: "pending",
        _clientKey: clientKey,
      };

      setMessages((prev) => {
        // Don't add duplicate optimistic bubble on retry
        if (prev.some((m) => m._clientKey === clientKey)) {
          return prev.map((m) =>
            m._clientKey === clientKey
              ? { ...m, _status: "pending" as MessageStatus, _error: undefined }
              : m,
          );
        }
        return [...prev, optimistic];
      });

      // Timeout guard
      const timeoutId = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._clientKey === clientKey && m._status === "pending"
              ? { ...m, _status: "error" as MessageStatus, _error: "Request timed out" }
              : m,
          ),
        );
      }, SEND_TIMEOUT_MS);

      try {
        const sent = await sendMessage(sessionId, clientMessageId, content);
        clearTimeout(timeoutId);
        setMessages((prev) =>
          prev.map((m) =>
            m._clientKey === clientKey
              ? { ...sent, _status: "sent" as MessageStatus, _clientKey: clientKey }
              : m,
          ),
        );
        // Update lastMsgId so polling doesn't re-fetch this message
        if (sent.id) lastMsgIdRef.current = sent.id;
      } catch (e) {
        clearTimeout(timeoutId);
        setMessages((prev) =>
          prev.map((m) =>
            m._clientKey === clientKey
              ? { ...m, _status: "error" as MessageStatus, _error: parseApiError(e) }
              : m,
          ),
        );
      }
    },
    [sessionId],
  );

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if (!content || isSending || !sessionId) return;
    setIsSending(true);
    setInputText("");
    const clientKey = `msg-${Date.now()}`;
    await doSend(content, clientKey);
    setIsSending(false);
  }, [inputText, isSending, sessionId, doSend]);

  const handleMoodSelect = useCallback(
    (mood: Mood) => {
      if (!sessionId) return;
      const clientKey = `mood-${mood}-${Date.now()}`;
      doSend(`I feel ${mood.toLowerCase()}.`, clientKey);
    },
    [sessionId, doSend],
  );

  const handleRetry = useCallback(
    (clientKey: string, content: string) => {
      doSend(content, clientKey);
    },
    [doSend],
  );

  const handleReloadSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setMessages([]);
    setSessionError(null);
    setSessionLoading(true);
    // Re-trigger session init
    createSession(childId)
      .then((sess) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sess.id);
        setSessionId(sess.id);
        setSessionLoading(false);
      })
      .catch((e) => {
        setSessionError(parseApiError(e));
        setSessionLoading(false);
      });
  }, [childId]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-snow-border bg-white shadow-sm">
      {/* Session loading */}
      {sessionLoading && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Starting your session with AgentKid"
          className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-snow-muted"
        >
          <Loader2 className="size-8 animate-spin text-snow-primary" />
          <p className="text-sm font-bold">Starting your session…</p>
        </div>
      )}

      {/* Session error */}
      {!sessionLoading && sessionError && (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
        >
          <AlertCircle className="size-8 text-snow-danger" />
          <p className="text-sm font-bold text-snow-danger">{sessionError}</p>
          <button
            type="button"
            onClick={handleReloadSession}
            className="snow-focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-snow-primary px-6 text-sm font-extrabold text-white"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </div>
      )}

      {/* Ready */}
      {!sessionLoading && !sessionError && sessionId && (
        <>
          {/* Mood picker */}
          <div className="shrink-0 border-b border-snow-border px-6 py-5">
            <h2 className="mb-1 text-xl font-black text-snow-primary-dark">
              How are you feeling today?
            </h2>
            <p className="mb-4 text-sm font-semibold text-snow-muted">
              Pick a feeling or talk to AgentKid.
            </p>
            <div className="flex flex-wrap gap-4">
              {moodData.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => handleMoodSelect(m.label)}
                    aria-label={`I feel ${m.label.toLowerCase()}`}
                    className={cn(
                      "snow-focus-ring flex h-28 w-24 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-white/50 p-4 shadow-sm transition-transform hover:-translate-y-1",
                      m.bg,
                    )}
                  >
                    <Icon className={cn("mb-2 size-9", m.color)} />
                    <span className={cn("text-sm font-black", m.color)}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message list */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with AgentKid"
            className="snow-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-6"
          >
            {messages.length === 0 && (
              <p className="text-center text-sm font-semibold text-snow-muted">
                Say hello to AgentKid!
              </p>
            )}
            {messages.map((msg) => {
              const isChild = msg.role === "child";
              const status = (msg as OptimisticMessage)._status;
              const error = (msg as OptimisticMessage)._error;
              const clientKey = (msg as OptimisticMessage)._clientKey;

              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-4", isChild ? "justify-end" : "justify-start")}
                >
                  {/* AgentKid avatar */}
                  {!isChild && (
                    <div className="mt-1 shrink-0">
                      <div className="grid size-10 place-items-center rounded-full border-2 border-snow-surface bg-snow-ice">
                        <Image
                          src="/images/snow-avatar-final.png"
                          alt="AgentKid"
                          width={32}
                          height={32}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[70%] flex-col",
                      isChild ? "items-end" : "items-start",
                    )}
                  >
                    {/* Sender + time */}
                    <div className="mb-1 flex items-center gap-2 px-1">
                      <span className="text-xs font-black text-snow-primary-dark">
                        {isChild ? "You" : "AgentKid"}
                      </span>
                      <span className="text-[10px] font-bold text-snow-muted">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {/* Pending/sent/error indicator */}
                      {isChild && status === "pending" && (
                        <Loader2
                          className="size-3 animate-spin text-snow-muted"
                          aria-label="Sending…"
                        />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl p-4 text-sm font-semibold leading-relaxed shadow-sm",
                        isChild
                          ? "rounded-tr-sm bg-snow-lavender text-snow-primary-dark"
                          : "rounded-tl-sm border border-snow-border bg-snow-surface text-snow-primary-dark",
                        isChild && status === "error" && "opacity-70",
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Error + retry */}
                    {isChild && status === "error" && clientKey && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-snow-danger">
                          {error ?? "Failed to send"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetry(clientKey, msg.content)}
                          className="snow-focus-ring inline-flex items-center gap-1 rounded-full border border-snow-danger/30 bg-snow-danger/10 px-3 py-1 text-xs font-bold text-snow-danger transition hover:bg-snow-danger/20"
                        >
                          <RefreshCw className="size-3" />
                          Retry
                        </button>
                      </div>
                    )}

                    {/* AgentKid suggested actions — kept from original */}
                    {!isChild && msg.content.includes("breathing exercise") && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-full border border-snow-success/20 bg-snow-success/10 px-4 py-2 text-xs font-bold text-snow-success"
                        >
                          <Leaf className="size-4" />
                          Yes, let&apos;s try
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-full border border-snow-aqua/20 bg-snow-aqua/10 px-4 py-2 text-xs font-bold text-snow-aqua"
                        >
                          <BookOpen className="size-4" />
                          Tell me a calm story
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-full border border-snow-peach/20 bg-snow-peach/10 px-4 py-2 text-xs font-bold text-snow-peach"
                        >
                          <Heart className="size-4" />
                          I need more help
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Child avatar */}
                  {isChild && (
                    <div className="mt-1 shrink-0">
                      <div className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-snow-surface bg-snow-ice">
                        <Image
                          src="/images/snow-avatar-final.png"
                          alt="You"
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input bar */}
          <div className="shrink-0 p-6 pt-3">
            <div className="flex items-center gap-3 rounded-full border border-snow-border bg-snow-surface p-2 shadow-sm">
              {/* Mic — disabled, no camera/voice in text UI */}
              <button
                type="button"
                aria-label="Voice input not available"
                aria-disabled="true"
                disabled
                className="grid size-12 shrink-0 cursor-not-allowed place-items-center rounded-full bg-snow-surface-soft text-snow-muted opacity-50"
              >
                <Mic className="size-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                aria-label="Type a message to AgentKid"
                placeholder="Tap to talk with AgentKid…"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-base font-semibold text-snow-primary-dark outline-none placeholder:text-snow-muted/60"
                disabled={isSending || !sessionId}
              />

              <button
                type="button"
                onClick={handleSend}
                aria-label="Send message"
                disabled={isSending || !inputText.trim() || !sessionId}
                className="snow-focus-ring grid size-12 shrink-0 place-items-center rounded-full bg-snow-lavender text-snow-primary transition hover:bg-snow-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
