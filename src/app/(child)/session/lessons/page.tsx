import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { LessonCatalog } from "@/components/learning";

export const metadata: Metadata = {
  title: "Danh mục Bài học - AgentKid Snow",
  description: "Khám phá các bài học tương tác hấp dẫn dành cho học sinh",
};

export default function Page() {
  return (
    <AppShell activeNav="lessons">
      <LessonCatalog />
    </AppShell>
  );
}
