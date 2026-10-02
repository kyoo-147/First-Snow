import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SnowCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
