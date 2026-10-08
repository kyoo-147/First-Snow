"use client";
import { t } from "@/i18n";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Edit2,
  PhoneCall,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  UserPlus,
} from "lucide-react";
import { PageHeader, ParentPageFrame, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import {
  EmergencyContactDialog,
  SafetyEmptyState,
  SafetyErrorBanner,
  SafetyLoadingSkeleton,
} from "@/components/safety";
import { SnowButton } from "@/components/ui/snow-button";
import {
  type CreateEmergencyContactPayload,
  createEmergencyContact,
  deleteEmergencyContact,
  type EmergencyContactRecord,
  getEmergencyContacts,
  SafetyApiError,
  updateEmergencyContact,
} from "@/lib/safety-client";
import { cn } from "@/lib/utils";

export function ParentEmergencyScreen() {
  const [contacts, setContacts] = useState<EmergencyContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContactRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(undefined);
    setRequestId(undefined);

    try {
      const data = await getEmergencyContacts();
      setContacts(data);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
        setRequestId(err.requestId);
      } else {
        setErrorMessage(t("parent", "emergency.errorLoad"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelectedContact(null);
    setDialogError(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(contact: EmergencyContactRecord) {
    setSelectedContact(contact);
    setDialogError(null);
    setIsDialogOpen(true);
  }

  async function handleSaveContact(payload: CreateEmergencyContactPayload) {
    setIsSaving(true);
    setDialogError(null);

    try {
      if (selectedContact) {
        // Edit
        const res = await updateEmergencyContact(selectedContact.id, payload);
        setContacts((prev) =>
          prev.map((c) => (c.id === selectedContact.id ? res.contact : c)),
        );
        setSuccessMessage(t("parent", "emergency.successUpdated", { name: res.contact.name }));
      } else {
        // Create
        const res = await createEmergencyContact(payload);
        setContacts((prev) => [...prev, res.contact]);
        setSuccessMessage(t("parent", "emergency.successAdded", { name: res.contact.name }));
      }

      setIsDialogOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setDialogError(err.message);
      } else {
        setDialogError(t("parent", "emergency.errorSave"));
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteContact(id: string) {
    setIsDeleting(true);
    setDialogError(null);

    try {
      await deleteEmergencyContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage(t("parent", "emergency.successRemoved"));
      setIsDialogOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof SafetyApiError) {
        setDialogError(err.message);
      } else {
        setDialogError(t("parent", "emergency.errorDelete"));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const primaryContact = contacts.find((c) => c.isPrimary);

  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow={t("parent", "emergency.eyebrow")}
        title={t("parent", "emergency.title")}
        description={t("parent", "emergency.description")}
        action={
          <div className="flex items-center gap-2">
            <SnowButton
              variant="ghost"
              onClick={loadContacts}
              disabled={isLoading}
              className="text-xs font-bold"
            >
              <RefreshCw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} />
              {t("parent", "emergency.syncContacts")}
            </SnowButton>
            <SnowButton onClick={handleOpenCreate} className="text-xs font-bold">
              <UserPlus className="mr-1.5 size-4" />
              {t("parent", "emergency.addContact")}
            </SnowButton>
          </div>
        }
      />

      {errorMessage ? (
        <SafetyErrorBanner
          message={errorMessage}
          code={errorCode}
          requestId={requestId}
          onRetry={loadContacts}
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
          label={t("parent", "emergency.contactsSaved")}
          value={isLoading ? "..." : `${contacts.length}`}
          detail={primaryContact ? t("parent", "emergency.primaryContact", { name: primaryContact.name }) : t("parent", "emergency.noPrimary")}
          icon={<PhoneCall className="size-5 text-snow-primary" />}
        />
        <StatusTile
          label={t("parent", "emergency.alertRouting")}
          value={t("parent", "emergency.notConfigured")}
          detail={t("parent", "emergency.noSmsProvider")}
          icon={<Bell className="size-5 text-snow-primary" />}
          tone="bg-snow-ice"
        />
        <StatusTile
          label={t("parent", "emergency.childVisibility")}
          value={t("parent", "emergency.hidden")}
          detail={t("parent", "emergency.strictBoundary")}
          icon={<ShieldCheck className="size-5 text-snow-primary" />}
          tone="bg-snow-lavender"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection
          title={t("parent", "emergency.authorizedContacts")}
          description={t("parent", "emergency.authorizedDesc")}
        >
          {isLoading ? (
            <SafetyLoadingSkeleton label={t("parent", "emergency.loadingContacts")} count={3} />
          ) : contacts.length === 0 ? (
            <SafetyEmptyState
              title={t("parent", "emergency.noContacts")}
              description={t("parent", "emergency.noContactsDesc")}
              action={
                <SnowButton onClick={handleOpenCreate} className="text-xs font-bold">
                  <Plus className="mr-1.5 size-3.5" />
                  {t("parent", "emergency.addPrimary")}
                </SnowButton>
              }
            />
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-snow-primary border border-snow-border">
                      <PhoneCall className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-snow-primary-dark">{contact.name}</p>
                        {contact.isPrimary ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-snow-primary-soft px-2 py-0.5 text-[10px] font-black text-snow-primary-dark">
                            <Star className="size-3 fill-snow-primary text-snow-primary" />{t("parent", "emergency.primary")}</span>
                        ) : (
                          <span className="rounded-full bg-snow-surface px-2 py-0.5 text-[10px] font-bold text-snow-muted border border-snow-border">{t("parent", "emergency.backup")}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-snow-muted">
                        {contact.relation} • {contact.phone}
                        {contact.email ? ` • ${contact.email}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <SnowButton
                      variant="ghost"
                      onClick={() => handleOpenEdit(contact)}
                      className="min-h-8 px-3 text-xs font-bold"
                    >
                      <Edit2 className="mr-1 size-3" />{t("parent", "emergency.edit")}</SnowButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>

        <aside className="space-y-4">
          <SettingsSection title={t("parent", "emergency.escalationStatus")}>
            {[
              { ok: true, text: t("parent", "emergency.ruleStored") },
              { ok: false, text: t("parent", "emergency.ruleUnavailable") },
              { ok: false, text: t("parent", "emergency.ruleNoDispatch") },
              { ok: true, text: t("parent", "emergency.ruleCalm") },
            ].map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-snow-surface-soft p-3 text-xs font-semibold leading-5 text-snow-primary-dark"
              >
                {rule.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-snow-success" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-snow-muted" />
                )}
                <span>{rule.text}</span>
              </div>
            ))}
          </SettingsSection>
        </aside>
      </div>

      <EmergencyContactDialog
        isOpen={isDialogOpen}
        contact={selectedContact}
        isSaving={isSaving}
        isDeleting={isDeleting}
        errorMessage={dialogError}
        onSave={handleSaveContact}
        onDelete={handleDeleteContact}
        onClose={() => setIsDialogOpen(false)}
      />
    </ParentPageFrame>
  );
}
