import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChildLoginView } from "@/components/auth/child-login-view";
import { t } from "@/i18n";

export const metadata = {
  title: "Đăng nhập mã PIN cho bé - AgentKid Snow",
  description: "Chọn hình đại diện và nhập mã PIN bí mật của bạn để cùng học với Snow",
};

export default function ChildLoginPage() {
  return (
    <AuthShell
      eyebrow={t("child", "login.eyebrow")}
      title={t("child", "login.title")}
      subtitle={t("child", "login.subtitle")}
      mode="child"
      mascotSpeech={t("child", "login.mascotSpeech")}
      maxWidth="md"
    >
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm font-semibold text-snow-muted">
            {t("child", "login.loading")}
          </div>
        }
      >
        <ChildLoginView />
      </Suspense>
    </AuthShell>
  );
}
