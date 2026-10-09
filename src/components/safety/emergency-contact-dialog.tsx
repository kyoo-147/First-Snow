"use client";
import { t } from "@/i18n";

import { useState } from "react";
import { Loader2, Phone, Trash2, X } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
import type { CreateEmergencyContactPayload, EmergencyContactRecord } from "@/lib/safety-client";

export interface EmergencyContactDialogProps {
  isOpen: boolean;
  contact?: EmergencyContactRecord | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
  onSave: (payload: CreateEmergencyContactPayload) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onClose: () => void;
}

function EmergencyContactDialogInner({
  contact,
  isSaving = false,
  isDeleting = false,
  errorMessage = null,
  onSave,
  onDelete,
  onClose,
}: Omit<EmergencyContactDialogProps, "isOpen">) {
  const isEditing = Boolean(contact);
  const [name, setName] = useState(contact?.name || "");
  const [relation, setRelation] = useState(contact?.relation || "Parent");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimary || false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setValidationError(t("parent", "safety.emergency.validationName"));
      return;
    }
    if (!relation.trim()) {
      setValidationError(t("parent", "safety.emergency.validationRelation"));
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setValidationError(t("parent", "safety.emergency.validationPhone"));
      return;
    }

    setValidationError(null);
    await onSave({
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      isPrimary,
    });
  }

  const effectiveError = errorMessage || validationError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs snow-enter-soft"
    >
      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
              <Phone className="size-5" />
            </div>
            <div>
              <h2 id="contact-dialog-title" className="text-base font-black text-snow-primary-dark">
                {isEditing ? t("parent", "safety.emergency.editTitle") : t("parent", "safety.emergency.addTitle")}
              </h2>
              <p className="text-xs font-semibold text-snow-muted">{t("parent", "safety.emergency.parentGate")}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("parent", "safety.emergency.closeAria")}
            disabled={isSaving || isDeleting}
            onClick={onClose}
            className="snow-focus-ring grid size-8 place-items-center rounded-full text-snow-muted hover:bg-snow-surface-soft hover:text-snow-primary-dark disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {effectiveError ? (
          <div
            role="alert"
            className="mt-3 rounded-[var(--radius-md)] border border-snow-danger/30 bg-snow-blush/60 p-3 text-xs font-bold text-snow-danger"
          >
            {effectiveError}
          </div>
        ) : null}

        {showDeleteConfirm && contact && onDelete ? (
          <div className="mt-4 rounded-[var(--radius-md)] border border-snow-danger/40 bg-snow-blush/40 p-4 space-y-3">
            <p className="text-xs font-black text-snow-danger">
              {t("parent", "safety.emergency.removeConfirmTitle", { name: contact.name })}
            </p>
            <p className="text-[11px] text-snow-muted">
              {t("parent", "safety.emergency.removeConfirmDesc")}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <SnowButton
                type="button"
                variant="ghost"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="min-h-8 px-3 text-xs"
              >
                {t("parent", "safety.emergency.cancel")}
              </SnowButton>
              <SnowButton
                type="button"
                variant="danger"
                disabled={isDeleting}
                onClick={() => onDelete(contact.id)}
                className="min-h-8 px-4 text-xs font-bold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3 animate-spin" />
                    {t("parent", "safety.emergency.removing")}
                  </>
                ) : (
                  t("parent", "safety.emergency.confirmRemove")
                )}
              </SnowButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-black text-snow-primary-dark">
                {t("parent", "safety.emergency.nameLabel")}
              </label>
              <div className="relative mt-1">
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("parent", "safety.emergency.namePlaceholder")}
                  className="snow-focus-ring w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="contact-relation"
                  className="block text-xs font-black text-snow-primary-dark"
                >
                  {t("parent", "safety.emergency.relationLabel")}
                </label>
                <input
                  id="contact-relation"
                  type="text"
                  required
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder={t("parent", "safety.emergency.relationPlaceholder")}
                  className="snow-focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-xs font-black text-snow-primary-dark">
                  {t("parent", "safety.emergency.phoneLabel")}
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("parent", "safety.emergency.phonePlaceholder")}
                  className="snow-focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-black text-snow-primary-dark">
                {t("parent", "safety.emergency.emailLabel")}
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("parent", "safety.emergency.emailPlaceholder")}
                className="snow-focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-snow-border bg-white px-3 py-2 text-xs font-semibold text-snow-primary-dark placeholder:text-snow-muted/70"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-2.5 text-xs font-semibold text-snow-primary-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="size-4 rounded border-snow-border text-snow-primary"
                />
                <div>
                  <span className="font-bold">{t("parent", "safety.emergency.markPrimary")}</span>
                  <p className="text-[11px] text-snow-muted">
                    {t("parent", "safety.emergency.primaryHelp")}
                  </p>
                </div>
              </label>

              <p className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-2.5 text-[11px] font-semibold text-snow-muted">
                {t("parent", "safety.emergency.providerNotice")}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3">
              {isEditing && onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="snow-focus-ring inline-flex items-center gap-1 rounded text-xs font-bold text-snow-danger hover:underline"
                >
                  <Trash2 className="size-3.5" />
                  {t("parent", "safety.emergency.remove")}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <SnowButton
                  type="button"
                  variant="ghost"
                  disabled={isSaving}
                  onClick={onClose}
                  className="min-h-9 px-3.5 text-xs font-bold"
                >
                  {t("parent", "safety.emergency.cancel")}
                </SnowButton>
                <SnowButton
                  type="submit"
                  disabled={isSaving}
                  className="min-h-9 px-4 text-xs font-bold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      {t("parent", "safety.emergency.saving")}
                    </>
                  ) : (
                    t("parent", "safety.emergency.saveContact")
                  )}
                </SnowButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function EmergencyContactDialog(props: EmergencyContactDialogProps) {
  if (!props.isOpen) return null;
  return <EmergencyContactDialogInner key={props.contact?.id || "new-contact"} {...props} />;
}
