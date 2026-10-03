import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ParentLoginForm } from "@/components/auth/parent-login-form";

export const metadata = {
  title: "Guardian Sign In - AgentKid Snow",
  description: "Secure login for parents and guardians in AgentKid Snow",
};

export default function ParentLoginAliasPage() {
  return (
    <AuthShell
      eyebrow="Parent Access"
      title="Guardian Sign In"
      subtitle="Access safety controls, learning insights, routines, and account settings."
      mode="parent"
      mascotSpeech="Hello grown-up! Welcome back to AgentKid Snow."
    >
      <Suspense fallback={<div className="py-8 text-center text-sm font-semibold text-snow-muted">Loading sign in form...</div>}>
        <ParentLoginForm />
      </Suspense>
    </AuthShell>
  );
}
