"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, PlusCircle, Sparkles, UserPlus } from "lucide-react";
import type { ChildProfileSummary } from "./auth-types";

type ChildProfileSelectorProps = {
  childrenList: ChildProfileSummary[];
  onSelectChild: (child: ChildProfileSummary) => void;
  isLoading?: boolean;
};

export function ChildProfileSelector({
  childrenList,
  onSelectChild,
  isLoading = false,
}: ChildProfileSelectorProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-snow-primary-soft border-t-snow-primary" />
        <p className="snow-body-small snow-font-readable font-bold text-snow-muted">
          Looking for your profile...
        </p>
      </div>
    );
  }

  if (childrenList.length === 0) {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
          <UserPlus className="size-8" />
        </div>
        <div>
          <h2 className="snow-heading font-black text-snow-primary-dark">
            No Child Profiles Found
          </h2>
          <p className="snow-body-small snow-font-readable mt-1.5 text-snow-muted font-semibold">
            Ask your grown-up to sign in to the Guardian Portal and add your profile.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/login"
            className="snow-focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-snow-primary px-5 text-sm font-black text-white shadow-[var(--shadow-card)] transition hover:brightness-105"
          >
            <Lock className="size-4" /> Go to Guardian Portal
          </Link>
          <Link
            href="/register"
            className="snow-focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-snow-border bg-snow-surface px-5 text-sm font-extrabold text-snow-primary-dark hover:bg-snow-surface-soft"
          >
            Create Guardian Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center snow-body-small snow-font-readable font-bold text-snow-muted">
        Who is learning with Snow today?
      </p>

      {/* Grid of Child Profiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {childrenList.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => onSelectChild(child)}
            className="snow-focus-ring snow-interactive-card group flex items-center gap-3.5 rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-3.5 text-left shadow-[var(--shadow-soft)] transition hover:border-snow-primary hover:bg-snow-primary-soft/30 active:scale-[0.98]"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-snow-border bg-snow-primary-soft">
              <Image
                src={child.avatarUrl || "/images/snow-avatar-final.png"}
                alt=""
                fill
                className="object-cover transition group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="snow-font-child truncate text-lg font-black text-snow-primary-dark group-hover:text-snow-primary">
                {child.name}
              </h3>
              <p className="truncate text-xs font-bold text-snow-muted">
                {child.age ? `Age ${child.age}` : ""}
                {child.grade ? ` &bull; ${child.grade}` : ""}
              </p>
            </div>
            <Sparkles className="size-5 shrink-0 text-snow-primary opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {/* Bottom Link for Guardian */}
      <div className="pt-3 text-center border-t border-snow-border/60">
        <Link
          href="/parent/children"
          className="snow-focus-ring inline-flex items-center gap-1.5 text-xs font-extrabold text-snow-primary hover:underline"
        >
          <PlusCircle className="size-3.5" /> Grown-up: Manage or add child profiles
        </Link>
      </div>
    </div>
  );
}
