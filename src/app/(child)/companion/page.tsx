import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { TalkRightRail } from "@/components/app-shell/right-rail";
import { TalkScreen } from "@/components/pages/talk-screen";

export const metadata: Metadata = {
  title: "Bạn đồng hành Học tập - AgentKid Snow",
  description: "Trò chuyện và học tập tương tác cùng bạn đồng hành AI Snow",
};

/** @deprecated Compatibility entry point; new AI-chat CTAs use /mia. */
export default function CompanionPage() {
  return (
    <AppShell activeNav="companion" rightPanel={<TalkRightRail />}>
      <TalkScreen />
    </AppShell>
  );
}
