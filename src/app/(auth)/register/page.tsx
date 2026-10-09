import { AuthShell } from "@/components/auth/auth-shell";
import { ParentRegisterForm } from "@/components/auth/parent-register-form";
import { t } from "@/i18n";

export const metadata = {
  title: "Đăng ký Phụ huynh - AgentKid Snow",
  description: "Tạo tài khoản phụ huynh cho AgentKid Snow để hướng dẫn và bảo vệ học sinh",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow={t("auth", "register.eyebrow")}
      title={t("auth", "register.title")}
      subtitle={t("auth", "register.subtitle")}
      mode="parent"
      mascotSpeech={t("auth", "register.mascotSpeech")}
    >
      <ParentRegisterForm />
    </AuthShell>
  );
}
