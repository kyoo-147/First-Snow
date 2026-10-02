import { AuthShell } from "@/components/auth/auth-shell";
import { SessionSwitchView } from "@/components/auth/session-switch-view";

export const metadata = {
  title: "Switch Profile - AgentKid Snow",
  description: "Switch between child profiles and guardian portal in AgentKid Snow",
};

export default function SessionSwitchPage() {
  return (
    <AuthShell
      title="Switch Profile"
      subtitle="Change learner or jump between child mode and guardian portal."
      mode="neutral"
      mascotSpeech="Where would you like to go next?"
      maxWidth="md"
    >
      <SessionSwitchView />
    </AuthShell>
  );
}
