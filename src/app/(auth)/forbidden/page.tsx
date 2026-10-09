import { AuthShell } from "@/components/auth/auth-shell";
import { ForbiddenView } from "@/components/auth/forbidden-view";
import { t } from "@/i18n";

export const metadata = {
  title: "Yêu cầu Quyền truy cập Phụ huynh - AgentKid Snow",
  description: "Yêu cầu xác thực của phụ huynh để truy cập an toàn và kiểm soát tài khoản",
};

export default function ForbiddenPage() {
  return (
    <AuthShell
      eyebrow={t("auth", "forbidden.eyebrow")}
      title={t("auth", "forbidden.title")}
      mode="neutral"
      mascotSpeech={t("auth", "forbidden.mascotSpeech")}
      maxWidth="sm"
    >
      <ForbiddenView />
    </AuthShell>
  );
}
