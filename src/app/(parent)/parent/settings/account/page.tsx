import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAccountScreen } from "@/components/pages/parent-account-screen";

export default function Page() {
  return (
    <ParentShell activeNav="account">
      <ParentAccountScreen />
    </ParentShell>
  );
}
