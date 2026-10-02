import { AuthShell } from "@/components/auth/auth-shell";
import { ParentRegisterForm } from "@/components/auth/parent-register-form";

export const metadata = {
  title: "Guardian Registration - AgentKid Snow",
  description: "Create a guardian account for AgentKid Snow to guide and protect your child",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="New Guardian Setup"
      title="Create Guardian Account"
      subtitle="Set up your family profile to protect and guide your child's learning journey."
      mode="parent"
      mascotSpeech="Welcome! Let's get your family safely started with Snow."
    >
      <ParentRegisterForm />
    </AuthShell>
  );
}
