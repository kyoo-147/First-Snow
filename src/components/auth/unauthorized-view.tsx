import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";

export function UnauthorizedView() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-lavender text-snow-primary">
        <Lock className="size-8" />
      </div>

      <div>
        <h2 className="snow-heading font-black text-snow-primary-dark">
          Sign In Required
        </h2>
        <p className="snow-body-small snow-font-readable mt-2 text-snow-muted font-semibold">
          To keep your learning progress and family settings safe, please sign in before continuing.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link href="/child-login">
          <SnowButton variant="primary" className="w-full text-base font-black">
            <Sparkles className="size-4" /> Child PIN Sign-in
          </SnowButton>
        </Link>

        <Link href="/login">
          <SnowButton variant="soft" className="w-full text-sm font-extrabold">
            <Lock className="size-4" /> Guardian Sign-in
          </SnowButton>
        </Link>

        <Link href="/">
          <SnowButton variant="ghost" className="w-full text-sm font-bold text-snow-muted">
            Back to Home
          </SnowButton>
        </Link>
      </div>
    </div>
  );
}
