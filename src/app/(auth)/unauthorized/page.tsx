import { AuthShell } from "@/components/auth/auth-shell";
import { UnauthorizedView } from "@/components/auth/unauthorized-view";

export const metadata = {
  title: "Sign In Required - AgentKid Snow",
  description: "Sign in to access your AgentKid Snow account",
};

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="Access Restricted"
      mode="neutral"
      mascotSpeech="Let's make sure you're signed in before we play or look at settings."
      maxWidth="sm"
    >
      <UnauthorizedView />
    </AuthShell>
  );
}
