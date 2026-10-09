import Image from "next/image";
import { t } from "@/i18n";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="snow-page-bg min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative size-20 overflow-hidden rounded-full border-2 border-snow-border bg-snow-primary-soft shadow-[var(--shadow-card)] snow-float-soft">
        <Image
          src="/images/snow-avatar-v2.png"
          alt={t("common", "snowMascot")}
          fill
          className="object-cover"
        />
      </div>
      <div className="mt-5 space-y-2">
        <h2 className="snow-heading font-black text-snow-primary-dark">
          {t("common", "loading")}
        </h2>
        <p className="snow-body-small snow-font-readable font-semibold text-snow-muted">
          {t("common", "aria.loading")}
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
