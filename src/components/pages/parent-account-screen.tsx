"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, Mail, RefreshCw, ShieldAlert, UserCircle } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { AccountApiError, changePassword, getAccount, type AccountCapabilities, type AccountProfile, updateAccount } from "@/lib/account-client";

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

  useEffect(() => {
    queueMicrotask(() => {
      void loadAccount();
    });
  }, [loadAccount]);

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
      <PageHeader eyebrow="Account" title="Parent account" description="Update your guardian profile and protect access to parent-only settings." action={<SnowButton variant="ghost" onClick={loadAccount} disabled={isLoading}><RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />Refresh</SnowButton>} />
      {error ? <Notice tone="error" message={error} /> : null}
      {success ? <Notice tone="success" message={success} /> : null}
      {isLoading ? <AccountSkeleton /> : account ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusTile label="Guardian" value={account.displayName} detail={account.household.name} icon={<UserCircle className="size-5 text-snow-primary" />} />
            <StatusTile label="Email" value="Sign-in address" detail={account.email} icon={<Mail className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
            <StatusTile label="Access" value="Password protected" detail={`${account.household.role} access`} icon={<LockKeyhole className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <SettingsSection title="Profile details" description="Your display name is visible only in the parent portal.">
              <form className="space-y-4" onSubmit={submitProfile}>
                <label className="block"><span className="text-sm font-black text-snow-primary-dark">Display name</span><input className={inputClass} value={displayName} minLength={2} maxLength={100} required onChange={(event) => setDisplayName(event.target.value)} /></label>
                <label className="block"><span className="text-sm font-black text-snow-primary-dark">Email</span><input className={inputClass} value={account.email} disabled /><span className="mt-2 block text-xs font-semibold text-snow-muted">Email changes and email verification are not available yet.</span></label>
                <SnowButton type="submit" disabled={isSaving || displayName.trim() === account.displayName}>{isSaving ? "Saving..." : "Save profile"}</SnowButton>
              </form>
            </SettingsSection>
            <SettingsSection title="Change password" description="Confirm your current password. Other signed-in parent sessions will be revoked.">
              <form className="space-y-4" onSubmit={submitPassword}>
                <PasswordField name="currentPassword" label="Current password" autoComplete="current-password" />
                <PasswordField name="newPassword" label="New password" autoComplete="new-password" minLength={8} />
                <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" minLength={8} />
                <SnowButton type="submit" disabled={isChangingPassword}>{isChangingPassword ? "Changing password..." : "Change password"}</SnowButton>
              </form>
            </SettingsSection>
          </div>
          <SettingsSection title="Security availability" description="Only controls backed by the current product are shown as active.">
            <div className="grid gap-3 md:grid-cols-2">
              <Availability label="Password protection" available detail="Current-password confirmation is required for password changes." />
              <Availability label="Other-session revocation" available detail="Changing your password revokes other parent sessions." />
              <Availability label="Multi-factor authentication" available={Boolean(capabilities?.mfa)} detail="Not available in this version." />
              <Availability label="Device and session manager" available={Boolean(capabilities?.sessionManagement)} detail="Individual device review and removal are not available." />
            </div>
          </SettingsSection>
        </>
      ) : <SettingsSection title="Account unavailable" description="No account data was loaded."><SnowButton onClick={loadAccount}>Try again</SnowButton></SettingsSection>}
    </ParentPageFrame>
  );
}

function messageFor(error: unknown, fallback: string) { return error instanceof AccountApiError ? error.message : fallback; }
function PasswordField({ name, label, autoComplete, minLength }: { name: string; label: string; autoComplete: string; minLength?: number }) { return <label className="block"><span className="text-sm font-black text-snow-primary-dark">{label}</span><input className={inputClass} type="password" name={name} autoComplete={autoComplete} minLength={minLength} maxLength={128} required /></label>; }
function Notice({ tone, message }: { tone: "success" | "error"; message: string }) { const Icon = tone === "success" ? CheckCircle2 : ShieldAlert; return <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-bold ${tone === "success" ? "border-snow-success/30 bg-snow-success/10 text-snow-success" : "border-snow-danger/30 bg-snow-danger/10 text-snow-danger"}`}><Icon className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>; }
function Availability({ label, available, detail }: { label: string; available: boolean; detail: string }) { return <div className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${available ? "bg-snow-success" : "bg-snow-muted"}`} /><p className="text-sm font-black text-snow-primary-dark">{label}</p></div><p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{detail}</p></div>; }
function AccountSkeleton() { return <div aria-label="Loading account details" className="space-y-5"><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-snow-surface-soft" />)}</div><div className="grid gap-5 xl:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-snow-surface-soft" />)}</div></div>; }
