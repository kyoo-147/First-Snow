"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, Loader2, Lock, Mail, Shield, User } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { registerParent } from "./auth-api";
import { t } from "@/i18n";

export function ParentRegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPasswordLongEnough = password.length >= 8;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMessage(t("auth", "register.missingFields"));
      return;
    }

    if (cleanName.length < 2) {
      setErrorMessage(t("auth", "register.missingFields"));
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t("auth", "register.minPassword"));
      return;
    }

    setIsLoading(true);

    try {
      await registerParent({
        name: cleanName,
        email: cleanEmail,
        password,
      });
      // After registration, redirect to parent onboarding / child management
      router.push("/parent/children");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred during registration. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      {/* Name Input */}
      <div>
        <label
          htmlFor="parent-register-name"
          className="block text-xs font-black uppercase tracking-wider text-snow-primary-dark"
        >
          {t("auth", "register.nameLabel")}
        </label>
        <div className="relative mt-1.5">
          <User
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-snow-muted"
            aria-hidden="true"
          />
          <input
            id="parent-register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("auth", "parentRegister.namePlaceholder")}
            className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft pl-10 pr-4 py-2.5 text-sm font-semibold text-snow-primary-dark placeholder:text-snow-muted/70 transition focus:border-snow-primary focus:bg-snow-surface disabled:opacity-60"
          />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label
          htmlFor="parent-register-email"
          className="block text-xs font-black uppercase tracking-wider text-snow-primary-dark"
        >
          {t("auth", "register.emailLabel")}
        </label>
        <div className="relative mt-1.5">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-snow-muted"
            aria-hidden="true"
          />
          <input
            id="parent-register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth", "parentLogin.emailPlaceholder")}
            className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft pl-10 pr-4 py-2.5 text-sm font-semibold text-snow-primary-dark placeholder:text-snow-muted/70 transition focus:border-snow-primary focus:bg-snow-surface disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="parent-register-password"
          className="block text-xs font-black uppercase tracking-wider text-snow-primary-dark"
        >
          {t("auth", "register.passwordLabel")}
        </label>
        <div className="relative mt-1.5">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-snow-muted"
            aria-hidden="true"
          />
          <input
            id="parent-register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth", "parentLogin.passwordPlaceholder")}
            className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft pl-10 pr-11 py-2.5 text-sm font-semibold text-snow-primary-dark placeholder:text-snow-muted/70 transition focus:border-snow-primary focus:bg-snow-surface disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="snow-focus-ring absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-snow-muted transition hover:text-snow-primary-dark"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* Password Strength Requirement */}
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`grid size-4 place-items-center rounded-full text-[10px] ${
              isPasswordLongEnough ? "bg-snow-success text-white" : "bg-snow-border text-snow-muted"
            }`}
          >
            <Check className="size-3 stroke-[3]" />
          </span>
          <span
            className={`font-semibold ${
              isPasswordLongEnough ? "text-snow-success" : "text-snow-muted"
            }`}
          >
            {t("auth", "register.minPassword")}
          </span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-3.5 text-xs text-snow-muted">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 size-4 shrink-0 text-snow-primary" aria-hidden="true" />
          <p className="font-semibold leading-relaxed">
            {t("auth", "parentRegister.privacyInfo")}
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <SnowButton
          type="submit"
          disabled={isLoading}
          variant="primary"
          className="w-full text-base font-black shadow-[var(--shadow-card)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("auth", "register.createBtnProgress")}
            </>
          ) : (
            t("auth", "parentRegister.createBtn")
          )}
        </SnowButton>
      </div>

      {/* Navigation Links */}
      <div className="pt-2 text-center">
        <p className="text-xs font-semibold text-snow-muted">
          {t("auth", "parentRegister.haveAccount")}{" "}
          <Link
            href="/login"
            className="snow-focus-ring font-extrabold text-snow-primary underline-offset-4 hover:underline"
          >
            {t("auth", "register.signInLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}
