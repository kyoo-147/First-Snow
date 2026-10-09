"use client";
import { t } from "@/i18n";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarCheck, Moon, Pencil, Plus, Sparkles, Sun, Trash2 } from "lucide-react";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { SnowCard } from "@/components/ui/snow-card";
import { cn } from "@/lib/utils";

type RoutineStep = { id: string; title: string; durationMinutes: number; isCompleted: boolean };
type Routine = {
  id: string;
  title: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "anytime";
  scheduledTime: string | null;
  isActive: boolean;
  steps: RoutineStep[];
};
type RoutineDraft = { title: string; timeOfDay: Routine["timeOfDay"]; scheduledTime: string; steps: string };
const blankDraft: RoutineDraft = { title: "", timeOfDay: "anytime", scheduledTime: "", steps: "" };

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message ?? body?.message ?? t("common", "error");
  } catch {
    return t("common", "error");
  }
}

function draftFromRoutine(routine: Routine): RoutineDraft {
  return {
    title: routine.title,
    timeOfDay: routine.timeOfDay,
    scheduledTime: routine.scheduledTime ?? "",
    steps: routine.steps.map((step) => step.title).join("\n"),
  };
}

function toSteps(value: string) {
  return value.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, durationMinutes: 5 }));
}

export function ParentRoutinesScreen({ childId }: { childId: string }) {
  const [childName, setChildName] = useState("Child");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoutineDraft>(blankDraft);

  const load = useCallback(async () => {
    try {
      const [childResponse, routineResponse] = await Promise.all([
        fetch(`/api/children/${encodeURIComponent(childId)}`, { credentials: "same-origin" }),
        fetch(`/api/children/${encodeURIComponent(childId)}/routines?date=${localDate()}`, { credentials: "same-origin" }),
      ]);
      if (!childResponse.ok) throw new Error(await responseError(childResponse));
      if (!routineResponse.ok) throw new Error(await responseError(routineResponse));
      const [childPayload, routinePayload] = await Promise.all([childResponse.json(), routineResponse.json()]);
      setError(null);
      setChildName(childPayload.child?.displayName ?? childPayload.child?.name ?? "Child");
      setRoutines(Array.isArray(routinePayload.routines) ? routinePayload.routines : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("parent", "routines.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const completedSteps = routines.flatMap((routine) => routine.steps).filter((step) => step.isCompleted).length;
  const totalSteps = routines.flatMap((routine) => routine.steps).length;

  function beginEdit(routine: Routine) {
    setEditingId(routine.id);
    setDraft(draftFromRoutine(routine));
    setShowCreate(false);
    setError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !draft.title.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: draft.title.trim(),
      timeOfDay: draft.timeOfDay,
      scheduledTime: draft.scheduledTime || null,
      steps: toSteps(draft.steps),
    };
    try {
      const response = editingId
        ? await fetch(`/api/children/${encodeURIComponent(childId)}/routines`, {
            method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ routineId: editingId, patch: payload }),
          })
        : await fetch(`/api/children/${encodeURIComponent(childId)}/routines`, {
            method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!response.ok) throw new Error(await responseError(response));
      setShowCreate(false);
      setEditingId(null);
      setDraft(blankDraft);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("parent", "routines.couldNotSave"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(routine: Routine) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/children/${encodeURIComponent(childId)}/routines`, {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: routine.id, patch: { isActive: !routine.isActive } }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("parent", "routines.couldNotUpdate"));
    } finally {
      setSaving(false);
    }
  }

  async function removeRoutine(routine: Routine) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/children/${encodeURIComponent(childId)}/routines?routineId=${encodeURIComponent(routine.id)}`, {
        method: "DELETE", credentials: "same-origin",
      });
      if (!response.ok) throw new Error(await responseError(response));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("parent", "routines.couldNotDelete"));
    } finally {
      setSaving(false);
    }
  }

  function routineForm(label: string) {
    return <form onSubmit={(event) => void save(event)} className="grid gap-3 rounded-2xl border border-snow-border bg-snow-surface-soft p-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold text-snow-primary-dark">{t("parent", "routines.routineTitle")}<input required maxLength={255} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="min-h-11 rounded-xl border border-snow-border bg-white px-3" /></label>
      <label className="grid gap-1 text-sm font-bold text-snow-primary-dark">{t("parent", "routines.timeOfDay")}<select value={draft.timeOfDay} onChange={(event) => setDraft({ ...draft, timeOfDay: event.target.value as Routine["timeOfDay"] })} className="min-h-11 rounded-xl border border-snow-border bg-white px-3"><option value="anytime">{t("parent", "routines.anyTime")}</option><option value="morning">{t("parent", "routines.morning")}</option><option value="afternoon">{t("parent", "routines.afternoon")}</option><option value="evening">{t("parent", "routines.evening")}</option></select></label>
      <label className="grid gap-1 text-sm font-bold text-snow-primary-dark">{t("parent", "routines.scheduledTime")}<input type="time" value={draft.scheduledTime} onChange={(event) => setDraft({ ...draft, scheduledTime: event.target.value })} className="min-h-11 rounded-xl border border-snow-border bg-white px-3" /></label>
      <label className="grid gap-1 text-sm font-bold text-snow-primary-dark md:row-span-2">{t("parent", "routines.steps")}<textarea rows={4} value={draft.steps} onChange={(event) => setDraft({ ...draft, steps: event.target.value })} className="rounded-xl border border-snow-border bg-white px-3 py-2" /></label>
      <div className="flex flex-wrap items-end gap-2"><button disabled={saving} className="min-h-11 rounded-full bg-snow-primary px-5 text-sm font-black text-white disabled:opacity-60">{saving ? t("parent", "account.saving") : label}</button><button type="button" onClick={() => { setShowCreate(false); setEditingId(null); setDraft(blankDraft); }} className="min-h-11 rounded-full border border-snow-border px-5 text-sm font-bold">{t("parent", "account.cancel")}</button></div>
    </form>;
  }

  return <ParentPageFrame>
    <PageHeader eyebrow={t("parent", "routines.childRoutines", { name: childName })} title={t("parent", "routines.title")} description={t("parent", "routines.manageRoutinesDesc", { name: childName })} action={<SnowButton onClick={() => { setShowCreate(true); setEditingId(null); setDraft(blankDraft); }}><Plus className="mr-2 size-4" />{t("parent", "routines.addRoutine")}</SnowButton>} />
    {error ? <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">{t("parent", "account.tryAgain")}</button></div> : null}
    <div className="grid gap-4 md:grid-cols-3"><StatusTile label={t("parent", "routines.activeRoutines")} value={`${routines.filter((routine) => routine.isActive).length}`} detail={t("parent", "routines.acrossDay")} icon={<CalendarCheck className="size-5 text-snow-primary" />} /><StatusTile label={t("parent", "routines.stepsComplete")} value={`${completedSteps}/${totalSteps}`} detail={t("parent", "routines.today")} icon={<Sparkles className="size-5 text-snow-primary" />} tone="bg-snow-ice" /><StatusTile label={t("parent", "routines.routineStyle")} value={t("parent", "routines.predictable")} detail={t("parent", "routines.repeatableSteps")} icon={<Sun className="size-5 text-snow-primary" />} tone="bg-snow-lavender" /></div>
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SnowCard className="p-5"><h2 className="text-xl font-black text-snow-primary-dark">{t("parent", "routines.routineSchedule")}</h2>
        <div className="mt-5 space-y-4">
          {showCreate ? routineForm(t("parent", "routines.createRoutine")) : null}
          {loading ? <p role="status" className="py-6 text-sm font-semibold text-snow-muted">{t("parent", "routines.loading")}</p> : null}
          {!loading && !routines.length && !showCreate ? <div className="rounded-2xl bg-snow-surface-soft p-6 text-center"><h3 className="font-black text-snow-primary-dark">{t("parent", "routines.noRoutines")}</h3><p className="mt-2 text-sm font-semibold text-snow-muted">{t("parent", "routines.createStepsMsg")}</p><button type="button" onClick={() => setShowCreate(true)} className="mt-4 min-h-10 rounded-full bg-snow-primary px-4 text-sm font-black text-white">{t("parent", "routines.createFirst")}</button></div> : null}
          {!loading ? routines.map((routine) => {
            const Icon = routine.timeOfDay === "morning" ? Sun : routine.timeOfDay === "evening" ? Moon : Sparkles;
            const timeOfDayLabel = routine.timeOfDay === "anytime"
              ? t("parent", "routines.anyTime")
              : t("parent", `routines.${routine.timeOfDay}`);
            return <div key={routine.id} className="rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft p-4">
              {editingId === routine.id ? routineForm(t("parent", "routines.saveChanges")) : <>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-center gap-4"><div className={cn("grid size-11 place-items-center rounded-full", routine.timeOfDay === "morning" ? "bg-snow-cream text-snow-warning" : "bg-snow-primary-soft text-snow-primary")}><Icon className="size-5" /></div><div className="min-w-0"><h3 className="font-black text-snow-primary-dark">{routine.title}</h3><p className="text-sm font-semibold capitalize text-snow-muted">{timeOfDayLabel}{routine.scheduledTime ? ` · ${routine.scheduledTime}` : ""} · {t("parent", "routines.stepsCount", { count: routine.steps.length })}</p></div></div>
                  <div className="flex flex-wrap gap-2"><button type="button" disabled={saving} aria-pressed={routine.isActive} onClick={() => void toggleActive(routine)} className={cn("min-h-10 rounded-full px-4 text-xs font-black disabled:opacity-60", routine.isActive ? "bg-snow-primary text-white" : "bg-snow-border text-snow-primary-dark")}>{routine.isActive ? t("parent", "routines.active") : t("parent", "routines.paused")}</button><button type="button" onClick={() => beginEdit(routine)} className="grid size-10 place-items-center rounded-full border border-snow-border bg-white" aria-label={t("parent", "routines.editRoutine", { title: routine.title })}><Pencil className="size-4" /></button><button type="button" disabled={saving} onClick={() => void removeRoutine(routine)} className="grid size-10 place-items-center rounded-full border border-snow-border bg-white text-red-700 disabled:opacity-60" aria-label={t("parent", "routines.deleteRoutine", { title: routine.title })}><Trash2 className="size-4" /></button></div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-3">{routine.steps.map((step) => <div key={step.id} className="rounded-[var(--radius-sm)] bg-snow-surface px-3 py-2"><p className="text-xs font-black text-snow-primary-dark">{step.title}</p><p className="mt-1 text-[11px] font-semibold text-snow-muted">{t("parent", "routines.stepDuration", { minutes: step.durationMinutes })} - {step.isCompleted ? t("parent", "routines.doneToday") : t("parent", "routines.upNext")}</p></div>)}</div>
                {editingId === routine.id ? routineForm(t("parent", "routines.saveChanges")) : null}
              </>}
            </div>;
          }) : null}
        </div>
      </SnowCard>
      <aside className="space-y-4"><SnowCard className="bg-snow-lavender p-5"><h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "routines.routineNote")}</h2><p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">{t("parent", "routines.routineNoteDesc")}</p></SnowCard><SnowCard className="p-5"><h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "routines.todaysCompletion")}</h2><p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">{t("parent", "routines.completionDesc")}</p></SnowCard></aside>
    </div>
  </ParentPageFrame>;
}
