"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { loginParent } from "./auth-api";

export function ParentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/parent";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      await loginParent({ email: cleanEmail, password });
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      {/* Email Input */}
      <div>
        <label
          htmlFor="parent-login-email"
          className="block text-xs font-black uppercase tracking-wider text-snow-primary-dark"
        >
          Guardian Email
        </label>
        <div className="relative mt-1.5">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-snow-muted"
            aria-hidden="true"
          />
          <input
            id="parent-login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guardian@example.com"
            className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft pl-10 pr-4 py-2.5 text-sm font-semibold text-snow-primary-dark placeholder:text-snow-muted/70 transition focus:border-snow-primary focus:bg-snow-surface disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="parent-login-password"
            className="block text-xs font-black uppercase tracking-wider text-snow-primary-dark"
          >
            Password
          </label>
        </div>
        <div className="relative mt-1.5">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-snow-muted"
            aria-hidden="true"
          />
          <input
            id="parent-login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
              Signing in...
            </>
          ) : (
            "Sign In as Guardian"
          )}
        </SnowButton>
      </div>

      {/* Navigation Links */}
      <div className="pt-2 text-center space-y-2">
        <p className="text-xs font-semibold text-snow-muted">
          Need a guardian account?{" "}
          <Link
            href="/register"
            className="snow-focus-ring font-extrabold text-snow-primary underline-offset-4 hover:underline"
          >
            Create one here
          </Link>
        </p>
        <p className="text-xs font-semibold text-snow-muted">
          Signing in for a child?{" "}
          <Link
            href="/child-login"
            className="snow-focus-ring font-extrabold text-snow-primary underline-offset-4 hover:underline"
          >
            Use Child PIN login
          </Link>
        </p>
      </div>
    </form>
  );
}
