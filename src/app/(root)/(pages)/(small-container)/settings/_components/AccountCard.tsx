"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SettingsAccountContext } from "../_types";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function AccountCard({ account }: Readonly<{ account: SettingsAccountContext }>) {
  const { t } = useTranslation();

  if (!account.name && !account.email) return null;

  const name = account.name ?? "";
  const roleKey = account.role ? `root.profile.roles.${account.role.toLowerCase()}` : null;

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 sm:px-5">
      <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-sm font-semibold text-[var(--primary)]">
        {account.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
        <p className="truncate text-[13px] text-[var(--muted-foreground)]">
          {account.email}
        </p>
        {roleKey || account.schoolName ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {roleKey ? (
              <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                {t(roleKey)}
              </span>
            ) : null}
            {account.schoolName ? (
              <span className="inline-flex max-w-full items-center truncate rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                {account.schoolName}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <Link
        href="/profile"
        className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-[var(--primary)] transition-opacity hover:opacity-75"
      >
        {t("root.pages.profile")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
