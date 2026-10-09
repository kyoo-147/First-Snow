import { AppShell } from "@/components/app-shell/app-shell";
import { TalkRightRail } from "@/components/app-shell/right-rail";
import { TalkScreen } from "@/components/pages/talk-screen";

/** Canonical child AI chat route. /companion remains a compatibility route. */
export default function MiaPage() {
  return (
    <AppShell activeNav="companion" rightPanel={<TalkRightRail />}>
      <TalkScreen />
    </AppShell>
  );
}
