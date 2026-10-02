import { ParentShell } from "@/components/parent/parent-shell";
import { ParentConsentScreen } from "@/components/pages/parent-consent-screen";

export default function Page() {
  return (
    <ParentShell activeNav="consent">
      <ParentConsentScreen />
    </ParentShell>
  );
}
