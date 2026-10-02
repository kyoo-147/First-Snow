import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";

export function ForbiddenView() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-peach/40 text-snow-primary-dark">
        <ShieldAlert className="size-8 text-snow-primary" />
      </div>

      <div>
        <h2 className="snow-heading font-black text-snow-primary-dark">
          Guardian Access Required
        </h2>
        <p className="snow-body-small snow-font-readable mt-2 text-snow-muted font-semibold">
          This area is protected by Parent Access to safeguard emergency controls, screen time rules,
          and privacy settings.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link href="/login?callbackUrl=/parent">
          <SnowButton variant="primary" className="w-full text-base font-black">
            Sign In with Guardian Credentials
          </SnowButton>
        </Link>

        <Link href="/session/home">
          <SnowButton variant="ghost" className="w-full text-sm font-extrabold text-snow-primary-dark">
            <ArrowLeft className="size-4" /> Return to Child Session
          </SnowButton>
        </Link>
      </div>
    </div>
  );
}
