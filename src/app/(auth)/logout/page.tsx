import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutView } from "@/components/auth/logout-view";
import { t } from "@/i18n";

export const metadata = {
  title: "Đăng xuất - AgentKid Snow",
  description: "Đăng xuất an toàn khỏi AgentKid Snow",
};

export default function LogoutPage() {
  return (
    <AuthShell
      title={t("auth", "logout.title")}
      mode="neutral"
      mascotSpeech={t("auth", "logout.mascotSpeech")}
      maxWidth="sm"
    >
      <LogoutView />
    </AuthShell>
  );
}
