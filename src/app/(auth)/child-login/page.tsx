import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChildLoginView } from "@/components/auth/child-login-view";

export const metadata = {
  title: "Child PIN Sign-in - AgentKid Snow",
  description: "Select your learner avatar and enter your secret PIN to play with Snow",
};

export default function ChildLoginPage() {
  return (
    <AuthShell
      eyebrow="Learner Sign-In"
      title="Welcome, Friend!"
      subtitle="Pick your picture and enter your secret 4-digit code to play."
      mode="child"
      mascotSpeech="Snow is excited to see you today! Let's learn and play together."
      maxWidth="md"
    >
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm font-semibold text-snow-muted">
            Finding your learner profile...
          </div>
        }
      >
        <ChildLoginView />
      </Suspense>
    </AuthShell>
  );
}
