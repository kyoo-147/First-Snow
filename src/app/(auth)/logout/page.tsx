import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutView } from "@/components/auth/logout-view";

export const metadata = {
  title: "Sign Out - AgentKid Snow",
  description: "Sign out securely from AgentKid Snow",
};

export default function LogoutPage() {
  return (
    <AuthShell
      title="Sign Out"
      mode="neutral"
      mascotSpeech="Take care! Snow will be right here waiting for you next time."
      maxWidth="sm"
    >
      <LogoutView />
    </AuthShell>
  );
}
