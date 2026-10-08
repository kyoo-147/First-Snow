"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Laptop, LockKeyhole, LogOut, Mail, RefreshCw, ShieldAlert, UserCircle } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { AccountApiError, changePassword, getAccount, getAccountSessions, revokeAccountSession, revokeOtherSessions, type AccountCapabilities, type AccountProfile, type AccountSession, updateAccount } from "@/lib/account-client";
import { formatSnowDateTime } from "@/lib/format";

import { t } from "@/i18n";

const inputClass = "mt-2 h-11 w-full rounded-[var(--radius-md)] border border-snow-border bg-snow-surface px-4 text-sm font-semibold text-snow-primary-dark outline-none transition focus:border-snow-primary disabled:cursor-not-allowed disabled:bg-snow-surface-soft disabled:text-snow-muted";

export function ParentAccountScreen() {
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [capabilities, setCapabilities] = useState<AccountCapabilities | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionAction, setSessionAction] = useState<string | null>(null);
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAccount();
      setAccount(result.account);
      setCapabilities(result.capabilities);
      setDisplayName(result.account.displayName);
    } catch (caught) {
      setError(messageFor(caught, "Account details could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      setSessions(await getAccountSessions());
    } catch (caught) {
      setError(messageFor(caught, "Active sessions could not be loaded."));
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAccount();
      void loadSessions();
    });
  }, [loadAccount, loadSessions]);

  async function revokeOthers() {
    setSessionAction("others");
    setError(null);
    setSuccess(null);
    try {
      const result = await revokeOtherSessions();
      setSuccess(result.message);
      setConfirmRevokeOthers(false);
      await loadSessions();
    } catch (caught) {
      setError(messageFor(caught, "Other sessions could not be revoked."));
    } finally {
      setSessionAction(null);
    }
  }

  async function revokeOne(id: string) {
    setSessionAction(id);
    setError(null);
    setSuccess(null);
    try {
      const result = await revokeAccountSession(id);
      setSuccess(result.message);
      setConfirmSessionId(null);
      await loadSessions();
    } catch (caught) {
      setError(messageFor(caught, "That session could not be revoked."));
    } finally {
      setSessionAction(null);
    }
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateAccount(displayName);
      setAccount(result.account);
      setDisplayName(result.account.displayName);
      setSuccess(result.message);
    } catch (caught) {
      setError(messageFor(caught, "Profile changes could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      form.reset();
      setSuccess(result.message);
    } catch (caught) {
      setError(messageFor(caught, "Password could not be changed."));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <ParentPageFrame>
      <PageHeader eyebrow={t("parent", "nav.account")} title={t("parent", "account.title")} description={t("parent", "account.description")} action={<SnowButton variant="ghost" onClick={() => { void loadAccount(); void loadSessions(); }} disabled={isLoading}><RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />{t("parent", "account.refresh")}</SnowButton>} />
      {error ? <Notice tone="error" message={error} /> : null}
      {success ? <Notice tone="success" message={success} /> : null}
      {isLoading ? <AccountSkeleton /> : account ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusTile label={t("parent", "account.guardian")} value={account.displayName} detail={account.household.name} icon={<UserCircle className="size-5 text-snow-primary" />} />
            <StatusTile label={t("parent", "account.email")} value={t("parent", "account.signInAddress")} detail={account.email} icon={<Mail className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
            <StatusTile label={t("parent", "account.access")} value={t("parent", "account.passwordProtected")} detail={t("parent", "account.roleAccess").replace('{{role}}', account.household.role)} icon={<LockKeyhole className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <SettingsSection title={t("parent", "account.profileDetails")} description={t("parent", "account.profileDesc")}>
              <form className="space-y-4" onSubmit={submitProfile}>
                <label className="block"><span className="text-sm font-black text-snow-primary-dark">{t("parent", "account.displayName")}</span><input className={inputClass} value={displayName} minLength={2} maxLength={100} required onChange={(event) => setDisplayName(event.target.value)} /></label>
                <label className="block"><span className="text-sm font-black text-snow-primary-dark">{t("parent", "account.email")}</span><input className={inputClass} value={account.email} disabled /><span className="mt-2 block text-xs font-semibold text-snow-muted">{t("parent", "account.emailChangesNotAvailable")}</span></label>
                <SnowButton type="submit" disabled={isSaving || displayName.trim() === account.displayName}>{isSaving ? t("parent", "account.saving") : t("parent", "account.saveProfile")}</SnowButton>
              </form>
            </SettingsSection>
            <SettingsSection title={t("parent", "account.changePasswordTitle")} description={t("parent", "account.changePasswordDesc")}>
              <form className="space-y-4" onSubmit={submitPassword}>
                <PasswordField name="currentPassword" label={t("parent", "account.currentPassword")} autoComplete="current-password" />
                <PasswordField name="newPassword" label={t("parent", "account.newPassword")} autoComplete="new-password" minLength={8} />
                <PasswordField name="confirmPassword" label={t("parent", "account.confirmNewPassword")} autoComplete="new-password" minLength={8} />
                <SnowButton type="submit" disabled={isChangingPassword}>{isChangingPassword ? t("parent", "account.changingPassword") : t("parent", "account.changePasswordBtn")}</SnowButton>
              </form>
            </SettingsSection>
          </div>
          <SettingsSection title={t("parent", "account.activeSessions")} description={t("parent", "account.activeSessionsDesc")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-snow-muted">
                {isLoadingSessions ? t("parent", "account.loadingSessions") : t("parent", "account.activeSessionsCount").replace('{{count}}', sessions.length.toString())}
              </p>
              {sessions.some((item) => !item.current) ? (
                confirmRevokeOthers ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold text-snow-danger">{t("parent", "account.revokeAllOtherSessions")}</span>
                    <SnowButton variant="danger" disabled={sessionAction === "others"} onClick={() => void revokeOthers()}>{sessionAction === "others" ? t("parent", "account.revoking") : t("parent", "account.confirm")}</SnowButton>
                    <SnowButton variant="ghost" disabled={sessionAction === "others"} onClick={() => setConfirmRevokeOthers(false)}>{t("parent", "account.cancel")}</SnowButton>
                  </span>
                ) : (
                  <SnowButton variant="soft" onClick={() => setConfirmRevokeOthers(true)}><LogOut className="mr-2 size-4" />{t("parent", "account.revokeOtherSessions")}</SnowButton>
                )
              ) : null}
            </div>
            {isLoadingSessions ? (
              <p role="status" className="text-sm font-semibold text-snow-muted">{t("parent", "account.loadingSessions")}</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm font-semibold text-snow-muted">{t("parent", "account.noActiveSessions")}</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((item) => (
                  <li key={item.id} className="flex flex-col justify-between gap-2 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-black text-snow-primary-dark">
                        <Laptop className="size-4 text-snow-primary" />
                        {deviceLabel(item.userAgent)}
                        {item.current ? <span className="rounded-full bg-snow-primary-soft px-2 py-0.5 text-[10px] font-black text-snow-primary-dark">{t("parent", "account.thisDevice")}</span> : null}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">{t("parent", "account.signedIn").replace('{{date}}', formatSnowDateTime(item.createdAt)).replace('{{expires}}', formatSnowDateTime(item.expiresAt))}</p>
                    </div>
                    {item.current ? null : confirmSessionId === item.id ? (
                      <span className="flex items-center gap-2">
                        <SnowButton variant="danger" disabled={sessionAction === item.id} onClick={() => void revokeOne(item.id)}>{sessionAction === item.id ? t("parent", "account.revoking") : t("parent", "account.confirmRevoke")}</SnowButton>
                        <SnowButton variant="ghost" disabled={sessionAction === item.id} onClick={() => setConfirmSessionId(null)}>{t("parent", "account.cancel")}</SnowButton>
                      </span>
                    ) : (
                      <SnowButton variant="ghost" onClick={() => setConfirmSessionId(item.id)}>{t("parent", "account.revoke")}</SnowButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SettingsSection>
          <SettingsSection title={t("parent", "account.securityAvailability")} description={t("parent", "account.securityAvailabilityDesc")}>
            <div className="grid gap-3 md:grid-cols-2">
              <Availability label={t("parent", "account.passwordProtection")} available detail={t("parent", "account.passwordProtectionDetail")} />
              <Availability label={t("parent", "account.otherSessionRevocation")} available detail={t("parent", "account.otherSessionRevocationDetail")} />
              <Availability label={t("parent", "account.mfa")} available={Boolean(capabilities?.mfa)} detail={t("parent", "account.notAvailable")} />
              <Availability label={t("parent", "account.deviceSessionManager")} available={Boolean(capabilities?.sessionManagement)} detail={t("parent", "account.deviceSessionManagerDetail")} />
            </div>
          </SettingsSection>
        </>
      ) : <SettingsSection title={t("parent", "account.accountUnavailable")} description={t("parent", "account.noAccountData")}><SnowButton onClick={loadAccount}>{t("parent", "account.tryAgain")}</SnowButton></SettingsSection>}
    </ParentPageFrame>
  );
}

function messageFor(error: unknown, fallback: string) { return error instanceof AccountApiError ? error.message : fallback; }
function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const platform = /Windows/.test(userAgent) ? "Windows" : /Macintosh|Mac OS X/.test(userAgent) ? "macOS" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad|iOS/.test(userAgent) ? "iOS" : /Linux/.test(userAgent) ? "Linux" : "device";
  return `${browser} on ${platform}`;
}
function PasswordField({ name, label, autoComplete, minLength }: { name: string; label: string; autoComplete: string; minLength?: number }) { return <label className="block"><span className="text-sm font-black text-snow-primary-dark">{label}</span><input className={inputClass} type="password" name={name} autoComplete={autoComplete} minLength={minLength} maxLength={128} required /></label>; }
function Notice({ tone, message }: { tone: "success" | "error"; message: string }) { const Icon = tone === "success" ? CheckCircle2 : ShieldAlert; return <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-bold ${tone === "success" ? "border-snow-success/30 bg-snow-success/10 text-snow-success" : "border-snow-danger/30 bg-snow-danger/10 text-snow-danger"}`}><Icon className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>; }
function Availability({ label, available, detail }: { label: string; available: boolean; detail: string }) { return <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${available ? "bg-snow-success" : "bg-snow-muted"}`} /><p className="text-sm font-black text-snow-primary-dark">{label}</p></div><p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{detail}</p></div>; }
function AccountSkeleton() { return <div aria-label={t("parent", "account.loadingAccountDetails")} className="space-y-5"><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-snow-surface-soft" />)}</div><div className="grid gap-5 xl:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-snow-surface-soft" />)}</div></div>; }
