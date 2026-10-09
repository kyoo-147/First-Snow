import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { t } from "@/i18n";
import { SnowLogo } from "@/components/ui/snow-logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  mode?: "parent" | "child" | "neutral";
  mascotSpeech?: string;
  maxWidth?: "sm" | "md" | "lg";
};

export function AuthShell({
  children,
  title,
  subtitle,
  eyebrow,
  mode = "neutral",
  mascotSpeech,
  maxWidth = "md",
}: AuthShellProps) {
  const maxWidthClass = {
    sm: "max-w-[420px]",
    md: "max-w-[480px]",
    lg: "max-w-[580px]",
  }[maxWidth];

  return (
    <div className="snow-page-bg min-h-[100dvh] flex flex-col justify-between text-snow-foreground">
      {/* Top Header */}
      <header className="z-20 flex min-h-[68px] items-center justify-between border-b border-snow-border/60 bg-snow-surface/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <Link href="/" aria-label={t("auth", "shell.homeAria")} className="snow-focus-ring rounded-lg">
          <SnowLogo />
        </Link>

        <div className="flex items-center gap-3">
          {mode === "parent" ? (
            <Link
              href="/child-login"
              className="snow-focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)] transition hover:bg-snow-surface-soft"
            >
              {t("auth", "shell.childPinSignIn")} <Sparkles className="size-3.5 text-snow-primary" />
            </Link>
          ) : mode === "child" ? (
            <Link
              href="/login"
              className="snow-focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-snow-border bg-snow-surface px-4 text-xs font-black text-snow-primary-dark shadow-[var(--shadow-card)] transition hover:bg-snow-surface-soft"
            >
              {t("auth", "shell.guardianPortal")} <Lock className="size-3.5 text-snow-primary" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/child-login"
                className="snow-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full border border-snow-border bg-snow-surface px-3 text-xs font-extrabold text-snow-primary-dark hover:bg-snow-surface-soft"
              >
                {t("auth", "shell.child")}
              </Link>
              <Link
                href="/login"
                className="snow-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full bg-snow-primary px-3 text-xs font-extrabold text-white shadow-[var(--shadow-card)] hover:brightness-105"
              >
                {t("auth", "shell.guardian")}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 sm:p-6 sm:py-12">
        <div className={cn("w-full snow-enter-soft", maxWidthClass)}>
          {/* Mascot Speech Bubble if provided */}
          {mascotSpeech ? (
            <div className="mb-4 flex items-end gap-3 px-2">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-snow-border bg-snow-primary-soft shadow-[var(--shadow-card)]">
                <Image
                  src="/images/snow-avatar-v2.png"
                  alt="Snow Mascot"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="relative rounded-[var(--radius-lg)] rounded-bl-sm border border-snow-border bg-snow-surface px-4 py-2.5 shadow-[var(--shadow-soft)]">
                <p className="snow-body-small snow-font-readable font-bold text-snow-primary-dark">
                  {mascotSpeech}
                </p>
              </div>
            </div>
          ) : null}

          {/* Form Card */}
          <div className="rounded-[var(--radius-2xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-stage)] sm:p-8">
            <div className="mb-6">
              {eyebrow ? (
                <p className="text-[11px] font-black uppercase tracking-wider text-snow-primary">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="snow-title text-[24px] sm:text-[28px] font-black leading-tight text-snow-primary-dark">
                {title}
              </h1>
              {subtitle ? (
                <p className="snow-body-small snow-font-readable mt-1.5 font-semibold text-snow-muted">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-snow-border/50 bg-snow-surface/50 py-4 text-center text-xs font-semibold text-snow-muted">
        <p>AgentKid Snow &bull; {t("auth", "shell.safeCompanion")} &bull; {t("auth", "shell.compliance")}</p>
      </footer>
    </div>
  );
}
