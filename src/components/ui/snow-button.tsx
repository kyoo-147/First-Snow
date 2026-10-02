import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SnowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "soft" | "ghost" | "danger";
};

export function SnowButton({ children, className, variant = "primary", ...props }: SnowButtonProps) {
  const styles = {
    primary: "bg-snow-primary text-white shadow-[var(--shadow-card)] hover:brightness-105",
    soft: "bg-snow-primary-soft text-snow-primary-dark hover:bg-snow-lavender",
    ghost: "bg-snow-surface text-snow-primary-dark border border-snow-border hover:bg-snow-surface-soft",
    danger: "bg-snow-danger text-white hover:brightness-105",
  };

  return (
    <button
      className={cn(
        "snow-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-full)] px-5 text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
