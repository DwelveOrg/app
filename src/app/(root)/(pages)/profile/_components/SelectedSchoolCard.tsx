"use client";

import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ProfileSelectedSchool } from "@/app/(root)/_lib/profile.schemas";
import OnboardingActions from "@/app/(root)/_components/OnboardingActions";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type SelectedSchoolCardProps = {
  selectedSchool: ProfileSelectedSchool | null;
};

/**
 * The active school on the profile page. `GET /profile` returns
 * `selectedSchool` for the school carried by the session token, so this card
 * shows that one school — never a count of schools or memberships
 * (see `docs/features/profile-page-contract.md`). Role comes from the
 * membership; there is no role picker here.
 */
export function SelectedSchoolCard({ selectedSchool }: Readonly<SelectedSchoolCardProps>) {
  const { t } = useTranslation();

  if (!selectedSchool) {
    return (
      <Surface as="section">
        <h2 className="text-base font-bold text-foreground">
          {t("root.profile.school.noneTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("root.profile.school.noneDescription")}
        </p>

        <OnboardingActions variant="compact" className="mt-4" />
      </Surface>
    );
  }

  const { school, member } = selectedSchool;
  const location = [school.city, school.country].filter(Boolean).join(", ");

  return (
    <Surface as="section">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("root.profile.school.title")}
      </h2>

      <div className="mt-3 flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{school.name}</p>
          {location ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>

        <Badge variant="primary" size="md">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t(`root.profile.roles.${member.role.toLowerCase()}`)}
        </Badge>
      </div>

      {school.description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {school.description}
        </p>
      ) : null}
    </Surface>
  );
}
