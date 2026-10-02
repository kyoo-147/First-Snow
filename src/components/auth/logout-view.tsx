"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { logoutUser } from "./auth-api";

export function LogoutView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to complete sign out. Please try again.");
      }
      setIsLoading(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
        <LogOut className="size-8" />
      </div>

      <div>
        <h2 className="snow-heading font-black text-snow-primary-dark">
          Sign Out of AgentKid Snow
        </h2>
        <p className="snow-body-small snow-font-readable mt-1.5 font-semibold text-snow-muted">
          Your learning progress and settings are safely stored. You can sign back in anytime.
        </p>
      </div>

      <AuthErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="pt-2 flex flex-col gap-2.5">
        <SnowButton
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          variant="primary"
          className="w-full text-base font-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing out safely...
            </>
          ) : (
            "Yes, Sign Out"
          )}
        </SnowButton>

        <SnowButton
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          variant="ghost"
          className="w-full text-sm font-extrabold"
        >
          Stay Signed In
        </SnowButton>
      </div>
    </div>
  );
}
