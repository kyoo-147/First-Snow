import { ParentShell } from "@/components/parent/parent-shell";
import { ParentPrivacyScreen } from "@/components/pages/parent-privacy-screen";

export default function Page() {
  return (
    <ParentShell activeNav="privacy">
      <ParentPrivacyScreen />
    </ParentShell>
  );
}
