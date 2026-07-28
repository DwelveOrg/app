"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ProfileMembershipEntry,
  ProfileSelectedSchool,
} from "@/app/(root)/_lib/profile.schemas";
import { cn } from "@/lib/utils";

type MembershipsPanelProps = {
  memberships: ProfileMembershipEntry[];
  selectedSchool: ProfileSelectedSchool | null;
};

export function MembershipsPanel({
  memberships,
  selectedSchool,
}: Readonly<MembershipsPanelProps>) {
  const { t } = useTranslation();

  if (memberships.length === 0) return null;

  const activeSchoolId = selectedSchool?.school.id ?? null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <Building2 className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("root.profile.memberships.title")}
          </h2>
          {/* Deliberately not a count: the profile page shows the active school,
              never a "you belong to N schools" metric. */}
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {t("root.profile.memberships.description")}
          </p>
        </div>
      </header>

      <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
        {memberships.map(({ membership, school }) => {
          const isActive = school.id === activeSchoolId;
          const roleKey = `root.profile.roles.${membership.role.toLowerCase()}`;

          return (
            <li
              key={membership.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5",
                isActive && "bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]",
              )}
            >
              <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                {school.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={school.logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-[18px] w-[18px]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {school.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {t(roleKey)}
                </p>
              </div>

              {isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("root.profile.memberships.active")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
