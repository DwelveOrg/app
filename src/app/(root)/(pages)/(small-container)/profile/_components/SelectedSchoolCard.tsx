"use client";

import { Building2, GraduationCap, MapPin, School, ShieldCheck, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { ProfileSelectedSchool } from "@/app/(root)/_lib/profile.schemas";
import JoinSchoolDialog from "@/app/(root)/(pages)/_components/ui/RoleEmptyState/JoinSchoolDialog";
import RedeemInviteDialog from "@/app/(root)/(pages)/_components/ui/RedeemInviteDialog";
import { Button } from "@/components/ui/Button";

type SelectedSchoolCardProps = {
  selectedSchool: ProfileSelectedSchool | null;
};

const ACTION_CLASS =
  "h-auto min-h-20 flex-col gap-1.5 whitespace-normal rounded-xl px-3 py-3 text-center";

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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-base font-bold text-[var(--foreground)]">
          {t("root.profile.school.noneTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t("root.profile.school.noneDescription")}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {/* Create a school — the action that makes the creator an admin. */}
          <Button asChild variant="outline" size="lg" className={ACTION_CLASS}>
            <Link href="/schools/new">
              <School className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {t("root.dashboard.empty.actions.createSchool")}
              </span>
            </Link>
          </Button>

          {/* Join with a student code. */}
          <JoinSchoolDialog
            trigger={
              <Button type="button" variant="outline" size="lg" className={ACTION_CLASS}>
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {t("root.dashboard.empty.actions.joinStudent")}
                </span>
              </Button>
            }
          />

          {/* Redeem an email-bound teacher invite. */}
          <RedeemInviteDialog
            trigger={
              <Button type="button" variant="outline" size="lg" className={ACTION_CLASS}>
                <TicketCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {t("root.dashboard.empty.actions.redeemInvite")}
                </span>
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  const { school, member } = selectedSchool;
  const location = [school.city, school.country].filter(Boolean).join(", ");

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {t("root.profile.school.title")}
      </h2>

      <div className="mt-3 flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[var(--foreground)]">{school.name}</p>
          {location ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t(`root.profile.roles.${member.role.toLowerCase()}`)}
        </span>
      </div>

      {school.description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {school.description}
        </p>
      ) : null}
    </section>
  );
}
