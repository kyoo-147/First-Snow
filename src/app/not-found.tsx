import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import { t } from "@/i18n";

export const metadata = {
  title: "Không tìm thấy trang - AgentKid Snow",
  description: "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.",
};

export default function NotFound() {
  return (
    <div className="snow-page-bg min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-lavender text-snow-primary">
        <AlertCircle className="size-8" />
      </div>

      <div className="mt-4 max-w-[420px] space-y-2">
        <h1 className="snow-heading font-black text-snow-primary-dark">
          {t("common", "notFoundState.title")}
        </h1>
        <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
          {t("common", "notFoundState.description")}
        </p>
      </div>

      <div className="mt-6">
        <Link href="/">
          <SnowButton variant="primary" className="min-w-[140px] gap-2">
            <Home className="size-4" /> {t("common", "notFoundState.returnHome")}
          </SnowButton>
        </Link>
      </div>
    </div>
  );
}
