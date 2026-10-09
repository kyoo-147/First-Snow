import Image from "next/image";
import { t } from "@/i18n";

export default function AuthLoading() {
  return (
    <div className="snow-page-bg min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative size-20 overflow-hidden rounded-full border-2 border-snow-border bg-snow-primary-soft shadow-[var(--shadow-card)] snow-float-soft">
        <Image
          src="/images/snow-avatar-final.png"
          alt={t("auth", "loading.snowPreparing")}
          fill
          className="object-cover"
        />
      </div>
      <div className="mt-5 space-y-2">
        <h2 className="snow-heading font-black text-snow-primary-dark">
          {t("auth", "loading.connecting")}
        </h2>
        <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
          {t("auth", "loading.settingUp")}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="size-2.5 animate-bounce rounded-full bg-snow-primary" />
        <span className="size-2.5 animate-bounce rounded-full bg-snow-aqua [animation-delay:0.2s]" />
        <span className="size-2.5 animate-bounce rounded-full bg-snow-lavender [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
