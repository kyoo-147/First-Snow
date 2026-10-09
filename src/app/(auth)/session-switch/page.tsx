import { AuthShell } from "@/components/auth/auth-shell";
import { SessionSwitchView } from "@/components/auth/session-switch-view";
import { t } from "@/i18n";

export const metadata = {
  title: "Chuyển đổi Hồ sơ - AgentKid Snow",
  description: "Chuyển đổi giữa hồ sơ học sinh và cổng thông tin phụ huynh trong AgentKid Snow",
};

export default function SessionSwitchPage() {
  return (
    <AuthShell
      title={t("auth", "sessionSwitch.title")}
      subtitle={t("auth", "sessionSwitch.subtitle")}
      mode="neutral"
      mascotSpeech={t("auth", "sessionSwitch.mascotSpeech")}
      maxWidth="md"
    >
      <SessionSwitchView />
    </AuthShell>
  );
}
