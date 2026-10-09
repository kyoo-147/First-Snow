import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ParentLoginForm } from "@/components/auth/parent-login-form";
import { t } from "@/i18n";

export const metadata = {
  title: "Đăng nhập Phụ huynh - AgentKid Snow",
  description: "Đăng nhập an toàn cho phụ huynh và người giám hộ trong AgentKid Snow",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow={t("auth", "login.eyebrow")}
      title={t("auth", "login.title")}
      subtitle={t("auth", "login.subtitle")}
      mode="parent"
      mascotSpeech={t("auth", "login.mascotSpeech")}
    >
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm font-semibold text-snow-muted">
            {t("auth", "login.loadingForm")}
          </div>
        }
      >
        <ParentLoginForm />
      </Suspense>
    </AuthShell>
  );
}
