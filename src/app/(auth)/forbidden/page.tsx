import { AuthShell } from "@/components/auth/auth-shell";
import { ForbiddenView } from "@/components/auth/forbidden-view";

export const metadata = {
  title: "Parent Access Required - AgentKid Snow",
  description: "Guardian authentication required to access safety and account controls",
};

export default function ForbiddenPage() {
  return (
    <AuthShell
      eyebrow="Protected Area"
      title="Parent Access Only"
      mode="neutral"
      mascotSpeech="Hold on, friend! This part of Snow has controls for grown-ups only."
      maxWidth="sm"
    >
      <ForbiddenView />
    </AuthShell>
  );
}
