"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";
import { ArrowLeft, Delete, Loader2, RotateCcw } from "lucide-react";
import { AuthErrorBanner } from "./auth-error-banner";
import { loginChild } from "./auth-api";
import type { ChildProfileSummary } from "./auth-types";

type ChildPinPadProps = {
  child: ChildProfileSummary;
  onBack: () => void;
};

const PIN_LENGTH = 4;

export function ChildPinPad({ child, onBack }: ChildPinPadProps) {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitPin = useCallback(
    async (submittedPin: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await loginChild({
          childId: child.id,
          pin: submittedPin,
        });
        // Redirect to child home on success
        router.push("/session/home");
        router.refresh();
      } catch (err: unknown) {
        setPin("");
        if (err instanceof Error) {
          setErrorMessage(
            err.message.includes("401") || err.message.toLowerCase().includes("invalid")
              ? t("auth", "child.pinPad.errorMismatch")
              : err.message,
          );
        } else {
          setErrorMessage(t("auth", "child.pinPad.errorGeneric"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [child.id, router],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLoading || pin.length >= PIN_LENGTH) return;
      setErrorMessage(null);
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === PIN_LENGTH) {
        void submitPin(nextPin);
      }
    },
    [isLoading, pin, submitPin],
  );

  const handleBackspace = useCallback(() => {
    if (isLoading || pin.length === 0) return;
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isLoading, pin]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setErrorMessage(null);
    setPin("");
  }, [isLoading]);

  // Keyboard accessibility: listen for digit keys, Backspace, Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLoading) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBackspace, handleClear, handleDigit, isLoading]);

  return (
    <div className="space-y-5">
      {/* Selected Child Header with Back Button */}
      <div className="flex items-center justify-between border-b border-snow-border pb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="snow-focus-ring flex items-center gap-1.5 rounded-full border border-snow-border bg-snow-surface px-3 py-1.5 text-xs font-black text-snow-primary-dark hover:bg-snow-surface-soft disabled:opacity-50"
        >
          <ArrowLeft className="size-3.5" /> {t("auth", "child.pinPad.changeProfile")}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative size-9 overflow-hidden rounded-full border border-snow-border bg-snow-primary-soft">
            <Image
              src={child.avatarUrl || "/images/snow-avatar-v2.png"}
              alt=""
              aria-hidden="true"
              fill
              className="object-cover"
            />
          </div>
          <span className="snow-font-child text-sm font-black text-snow-primary-dark">
            {child.name}
          </span>
        </div>
      </div>

      <AuthErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      {/* Instruction */}
      <div className="text-center">
        <p className="snow-title-compact text-[20px] font-black text-snow-primary-dark">
          {t("auth", "child.pinPad.title")}
        </p>
        <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">
          {t("auth", "child.pinPad.subtitle")}
        </p>
      </div>

      {/* 4 PIN Dots Indicator */}
      <div
        className="flex items-center justify-center gap-3.5 py-2"
        role="status"
        aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <div
              key={index}
              className={`size-5 rounded-full border-2 transition-all duration-200 ${
                isFilled
                  ? "scale-110 border-snow-primary bg-snow-primary shadow-[var(--shadow-card)]"
                  : "border-snow-border bg-snow-surface-soft"
              }`}
            />
          );
        })}
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-snow-primary">
          <Loader2 className="size-5 animate-spin" />
          <span>{t("auth", "child.pinPad.loading")}</span>
        </div>
      ) : null}

      {/* Numeric Keypad Grid */}
      <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isLoading}
            onClick={() => handleDigit(digit)}
            aria-label={t("auth", "child.pinPad.digit", { digit })}
            className="snow-focus-ring grid size-16 place-items-center rounded-full border border-snow-border bg-snow-surface text-2xl font-black text-snow-primary-dark shadow-[var(--shadow-soft)] transition hover:border-snow-primary hover:bg-snow-primary-soft/40 active:scale-95 disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleClear}
          aria-label={t("auth", "child.pinPad.clear")}
          className="snow-focus-ring grid size-16 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-muted transition hover:bg-snow-surface-soft hover:text-snow-primary-dark active:scale-95 disabled:opacity-40"
        >
          <RotateCcw className="size-5" />
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleDigit("0")}
          aria-label={t("auth", "child.pinPad.digit", { digit: "0" })}
          className="snow-focus-ring grid size-16 place-items-center rounded-full border border-snow-border bg-snow-surface text-2xl font-black text-snow-primary-dark shadow-[var(--shadow-soft)] transition hover:border-snow-primary hover:bg-snow-primary-soft/40 active:scale-95 disabled:opacity-50"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleBackspace}
          aria-label={t("auth", "child.pinPad.backspace")}
          className="snow-focus-ring grid size-16 place-items-center rounded-full border border-snow-border bg-snow-surface text-snow-muted transition hover:bg-snow-surface-soft hover:text-snow-primary-dark active:scale-95 disabled:opacity-40"
        >
          <Delete className="size-5" />
        </button>
      </div>
    </div>
  );
}
