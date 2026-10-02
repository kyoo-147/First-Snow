"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Mail,
  MessageSquare,
  Moon,
  PhoneCall,
  RefreshCw,
  Shield,
  Smartphone,
} from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SafetyErrorBanner, SafetyLoadingSkeleton } from "@/components/safety";
import { SnowButton } from "@/components/ui/snow-button";
import {
  getNotificationPreferences,
  type NotificationChannel,
  type NotificationFrequency,
  type NotificationPreferencesData,
  type ReportCadence,
  SafetyApiError,
  updateNotificationPreferences,
} from "@/lib/safety-client";
import { cn } from "@/lib/utils";

export function ParentNotificationsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(undefined);
    setRequestId(undefined);

    try {
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage("Failed to load notification preferences from the server.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleChannel(key: "emailAlerts" | "pushAlerts" | "weeklyReport" | "emergencySmsAlerts") {
    if (!preferences || isSaving) return;

    const previousValue = preferences[key];
    const nextValue = !previousValue;
    const optimistic = { ...preferences, [key]: nextValue };

    setPreferences(optimistic);
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await updateNotificationPreferences({ [key]: nextValue });
      setPreferences(updated);
      setSuccessMessage("Notification channel updated.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setPreferences(preferences);
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage("Failed to update notification setting. Change was rolled back.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeliveryChange(
    channel?: NotificationChannel,
    frequency?: NotificationFrequency,
  ) {
    if (!preferences || isSaving) return;

    const nextDelivery = {
      ...preferences.deliveryPreference,
      ...(channel ? { channel } : {}),
      ...(frequency ? { frequency } : {}),
    };

    const optimistic = {
      ...preferences,
      deliveryPreference: nextDelivery,
    };

    setPreferences(optimistic);
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await updateNotificationPreferences({
        deliveryPreference: nextDelivery,
      });
      setPreferences(updated);
      setSuccessMessage("Delivery preference saved.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setPreferences(preferences);
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update delivery preference.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCadenceChange(cadence: ReportCadence) {
    if (!preferences || isSaving) return;

    const optimistic = { ...preferences, reportCadence: cadence };
    setPreferences(optimistic);
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await updateNotificationPreferences({ reportCadence: cadence });
      setPreferences(updated);
      setSuccessMessage("Summary report cadence updated.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setPreferences(preferences);
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update report cadence.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Guardian Settings"
        title="Notifications & alert routing"
        description="Configure how and when you receive session summaries, learning milestones, and urgent safety escalations. Child interfaces never receive alert pings."
        action={
          <SnowButton
            variant="ghost"
            onClick={loadPreferences}
            disabled={isLoading}
            className="text-xs font-bold"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} />
            Sync Preferences
          </SnowButton>
        }
      />

      {errorMessage ? (
        <SafetyErrorBanner
          message={errorMessage}
          code={errorCode}
          requestId={requestId}
          onRetry={loadPreferences}
        />
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-snow-success/30 bg-snow-success/10 px-4 py-2.5 text-xs font-bold text-snow-success snow-enter-soft"
        >
          <CheckCircle2 className="size-4" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          label="Email alerts"
          value={preferences?.emailAlerts ? "Enabled" : "Off"}
          detail={preferences?.verifiedEmail ? `To: ${preferences.verifiedEmail}` : "Parent email"}
          icon={<Mail className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label="Device push"
          value={preferences?.pushAlerts ? "Active" : "Off"}
          detail={
            preferences?.pushDeviceCount !== undefined
              ? `${preferences.pushDeviceCount} device(s) registered`
              : "Parent device only"
          }
          icon={<Smartphone className="size-5 text-snow-primary" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label="Summary cadence"
          value={preferences?.reportCadence ? preferences.reportCadence.toUpperCase() : "WEEKLY"}
          detail="Calm observation review"
          icon={<BellRing className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <SettingsSection
            title="Notification Channels"
            description="Choose which delivery channels AgentKid may use to reach you."
          >
            {isLoading ? (
              <SafetyLoadingSkeleton label="Loading notification preferences..." count={4} />
            ) : preferences ? (
              <div className="space-y-3">
                {[
                  {
                    key: "emailAlerts" as const,
                    title: "Guardian Email Notifications",
                    detail: "Receives learning summaries, milestone recaps, and account alerts.",
                    icon: Mail,
                    enabled: preferences.emailAlerts,
                  },
                  {
                    key: "pushAlerts" as const,
                    title: "Mobile Push Notifications",
                    detail: "Time-sensitive prompts for consent review or active session breaks.",
                    icon: Smartphone,
                    enabled: preferences.pushAlerts,
                  },
                  {
                    key: "emergencySmsAlerts" as const,
                    title: "Urgent Safety SMS Escalations",
                    detail: "High-priority SMS alerts delivered to primary emergency contacts.",
                    icon: PhoneCall,
                    enabled: preferences.emergencySmsAlerts,
                  },
                  {
                    key: "weeklyReport" as const,
                    title: "Weekly Learning & Routine Report",
                    detail: "Comprehensive Friday recap of practice sessions and conversation insights.",
                    icon: MessageSquare,
                    enabled: preferences.weeklyReport,
                  },
                ].map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div
                      key={channel.key}
                      className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-snow-primary border border-snow-border">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-snow-primary-dark">{channel.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-snow-muted">
                            {channel.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={channel.enabled}
                          aria-label={`Toggle ${channel.title}`}
                          disabled={isSaving}
                          onClick={() => handleToggleChannel(channel.key)}
                          className={cn(
                            "snow-focus-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50",
                            channel.enabled ? "bg-snow-success" : "bg-snow-border",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                              channel.enabled ? "translate-x-5" : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            title="Delivery Preferences & Dispatch Mode"
            description="Control delivery channel bundling and notification frequency."
          >
            {preferences ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">
                    Preferred Delivery Channel
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { id: "email", label: "Email Only" },
                      { id: "push", label: "Push Only" },
                      { id: "both", label: "Both (Recommended)" },
                      { id: "none", label: "Mute All" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleDeliveryChange(opt.id as NotificationChannel)}
                        className={cn(
                          "snow-focus-ring rounded-[var(--radius-md)] border p-2.5 text-xs font-bold transition",
                          preferences.deliveryPreference?.channel === opt.id
                            ? "border-snow-primary bg-snow-primary-soft text-snow-primary font-black"
                            : "border-snow-border bg-white text-snow-muted hover:border-snow-border-strong",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">
                    Dispatch Frequency
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      {
                        id: "immediate",
                        label: "Real-time Immediate",
                        desc: "Dispatched upon event",
                      },
                      {
                        id: "digest_daily",
                        label: "Daily Digest",
                        desc: "Batched at 7:00 PM",
                      },
                      {
                        id: "digest_weekly",
                        label: "Weekly Digest",
                        desc: "Batched on Fridays",
                      },
                    ].map((freq) => (
                      <button
                        key={freq.id}
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          handleDeliveryChange(undefined, freq.id as NotificationFrequency)
                        }
                        className={cn(
                          "snow-focus-ring flex flex-col items-start rounded-[var(--radius-md)] border p-3 text-left transition",
                          preferences.deliveryPreference?.frequency === freq.id
                            ? "border-snow-primary bg-snow-primary-soft text-snow-primary font-black"
                            : "border-snow-border bg-white text-snow-muted hover:border-snow-border-strong",
                        )}
                      >
                        <span className="text-xs font-bold">{freq.label}</span>
                        <span className="mt-0.5 text-[10px] text-snow-muted">{freq.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-snow-primary-dark">
                    Summary Report Cadence
                  </label>
                  <div className="mt-2 flex gap-2">
                    {(["daily", "weekly", "monthly"] as ReportCadence[]).map((cadence) => (
                      <button
                        key={cadence}
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleCadenceChange(cadence)}
                        className={cn(
                          "snow-focus-ring rounded-[var(--radius-full)] px-4 py-1.5 text-xs font-bold capitalize transition",
                          preferences.reportCadence === cadence
                            ? "bg-snow-primary text-white"
                            : "border border-snow-border bg-white text-snow-muted hover:bg-snow-surface-soft",
                        )}
                      >
                        {cadence}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </SettingsSection>
        </div>

        <aside className="space-y-4">
          <SettingsSection title="Quiet Hours Protocol">
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-snow-surface-soft p-3.5">
              <Moon className="size-5 shrink-0 text-snow-primary" />
              <div className="text-xs">
                <p className="font-black text-snow-primary-dark">Nighttime Do Not Disturb</p>
                <p className="mt-1 leading-5 text-snow-muted">
                  Non-urgent routine updates and milestone summaries are muted between 9:00 PM and
                  7:00 AM. Emergency escalations bypass quiet hours.
                </p>
              </div>
            </div>
          </SettingsSection>

          <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-snow-primary" />
              <h2 className="text-sm font-black text-snow-primary-dark">Guardian Exclusivity</h2>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-snow-primary-dark">
              Notifications are routed to configured guardian contact channels.
              Children never see alerts, notification prompts, or system banners in their session UI.
            </p>
          </div>
        </aside>
      </div>
    </ParentPageFrame>
  );
}
