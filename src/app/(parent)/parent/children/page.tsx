import { ParentShell } from "@/components/parent/parent-shell";
import { ParentChildrenScreen } from "@/components/pages/parent-children-screen";

export default function Page() {
  return (
    <ParentShell activeNav="children">
      <ParentChildrenScreen />
    </ParentShell>
  );
}
