"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ProfileMembershipEntry,
  ProfileSelectedSchool,
} from "@/app/(root)/_lib/profile.schemas";
import SectionHeader from "@/app/(root)/_components/SectionHeader";
import { cn } from "@/lib/utils";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

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
    <Surface as="section">
      {/* The description is deliberately not a count, and deliberately does not
          promise switching: school selection runs through `POST /auth/select-school`,
          which this frontend does not call anywhere yet. Copy that offers a
          control the page does not have is a bug report waiting to happen. */}
      <SectionHeader
        icon={Building2}
        title={t("root.profile.memberships.title")}
        description={t("root.profile.memberships.description")}
        className="mb-5"
      />

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
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
              <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
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
                <p className="truncate text-sm font-semibold text-foreground">
                  {school.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(roleKey)}
                </p>
              </div>

              {isActive ? (
                <Badge variant="primary" size="md">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("root.profile.memberships.active")}
                </Badge>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}
