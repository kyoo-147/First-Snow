import { AuthShell } from "@/components/auth/auth-shell";
import { UnauthorizedView } from "@/components/auth/unauthorized-view";
import { t } from "@/i18n";

export const metadata = {
  title: "Yêu cầu Đăng nhập - AgentKid Snow",
  description: "Đăng nhập để truy cập tài khoản AgentKid Snow của bạn",
};

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title={t("auth", "unauthorized.title")}
      mode="neutral"
      mascotSpeech={t("auth", "unauthorized.mascotSpeech")}
      maxWidth="sm"
    >
      <UnauthorizedView />
    </AuthShell>
  );
}
