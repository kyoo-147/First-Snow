import { AppShell } from "@/components/app-shell/app-shell";
import { TalkRightRail } from "@/components/app-shell/right-rail";
import { TalkScreen } from "@/components/pages/talk-screen";

export default function CompanionPage() {
  return (
    <AppShell activeNav="companion" rightPanel={<TalkRightRail />}>
      <TalkScreen />
    </AppShell>
  );
}
