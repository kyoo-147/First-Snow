import Image from "next/image";
import { cn } from "@/lib/utils";

export function SnowLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex h-10 items-center gap-2.5">
      <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-snow-border bg-snow-primary-soft">
        <Image src="/images/snow-avatar-v2.png" alt="" aria-hidden="true" width={28} height={28} className="object-cover" />
      </span>
      <span className={cn("whitespace-nowrap text-[18px] font-semibold tracking-[-0.02em] text-snow-foreground", compact && "sr-only")}>
        AgentKid
      </span>
    </div>
  );
}
