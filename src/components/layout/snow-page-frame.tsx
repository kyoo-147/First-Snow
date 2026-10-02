import type { ReactNode } from "react";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function PageHeader({ eyebrow, title, description, action, compact = false }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-black text-snow-primary">{eyebrow}</p> : null}
        <h1
          className={cn(
            "font-black leading-[1.08] text-snow-primary-dark text-balance",
            compact ? "snow-title-compact" : "snow-title md:text-[var(--text-title-large)]",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="snow-body-small snow-font-readable mt-2 max-w-[760px] font-semibold text-snow-muted md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function ParentPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("snow-font-ui mx-auto w-full max-w-[var(--parent-page-max)] space-y-[var(--section-gap)] pb-8", className)}>{children}</div>;
}

export function ChildSessionFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("snow-font-child mx-auto flex min-h-[calc(100dvh-112px)] w-full max-w-[var(--child-page-max)] flex-col gap-[var(--section-gap)] pb-8 pt-5 lg:pt-6", className)}>{children}</div>;
}

export function ContentGrid({
  children,
  columns = "lg:grid-cols-[minmax(0,1fr)_320px]",
  className,
}: {
  children: ReactNode;
  columns?: string;
  className?: string;
}) {
  return <div className={cn("grid gap-5", columns, className)}>{children}</div>;
}

export function StatusTile({
  label,
  value,
  detail,
  icon,
  tone = "bg-snow-surface-soft",
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: string;
}) {
  return (
    <SnowCard className="snow-card-pad">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-snow-muted">{label}</p>
          <p className="mt-2 text-[clamp(1.25rem,1.6vw,1.75rem)] font-black leading-tight text-snow-primary-dark">{value}</p>
          {detail ? <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{detail}</p> : null}
        </div>
        {icon ? <div className={cn("grid size-10 shrink-0 place-items-center rounded-full", tone)}>{icon}</div> : null}
      </div>
    </SnowCard>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <SnowCard className="snow-card-pad">
      <div>
        <h2 className="snow-heading font-black text-snow-primary-dark">{title}</h2>
        {description ? <p className="snow-body-small snow-font-readable mt-1 font-semibold text-snow-muted">{description}</p> : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </SnowCard>
  );
}
