import { BellOff, HelpCircle, Mic, Moon, Type } from "lucide-react";
import { ChildSessionFrame, PageHeader, SettingsSection } from "@/components/layout/snow-page-frame";
import { t } from "@/i18n";

export function ChildPreferencesScreen() {
  const preferences = [
    {
      title: t("child", "preferences.voiceTitle"),
      description: t("child", "preferences.voiceDesc"),
      icon: Mic,
      value: t("child", "preferences.calm"),
    },
    {
      title: t("child", "preferences.textTitle"),
      description: t("child", "preferences.textDesc"),
      icon: Type,
      value: t("child", "preferences.on"),
    },
    {
      title: t("child", "preferences.motionTitle"),
      description: t("child", "preferences.motionDesc"),
      icon: Moon,
      value: t("child", "preferences.on"),
    },
    {
      title: t("child", "preferences.soundTitle"),
      description: t("child", "preferences.soundDesc"),
      icon: BellOff,
      value: t("child", "preferences.soft"),
    },
  ];

  return (
    <ChildSessionFrame className="justify-center">
      <PageHeader
        title={t("child", "preferences.title")}
        description={t("child", "preferences.description")}
        compact
      />
      <div className="grid gap-4 md:grid-cols-2">
        {preferences.map((item) => {
          const Icon = item.icon;
          return (
            <SettingsSection key={item.title} title={item.title} description={item.description}>
              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-black text-snow-primary-dark">{item.value}</span>
                </div>
                <div className="relative h-6 w-11 rounded-full bg-snow-primary">
                  <div className="absolute right-1 top-1 size-4 rounded-full bg-white" />
                </div>
              </div>
            </SettingsSection>
          );
        })}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-snow-primary">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <p className="text-base font-black text-snow-primary-dark">{t("child", "preferences.needHelpTitle")}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-snow-primary-dark">
              {t("child", "preferences.needHelpDesc")}
            </p>
          </div>
        </div>
      </div>
    </ChildSessionFrame>
  );
}
