"use client";

import { GraduationCap, School, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import JoinSchoolDialog from "@/app/(root)/(pages)/_components/ui/RoleEmptyState/JoinSchoolDialog";
import RedeemInviteDialog from "@/app/(root)/(pages)/_components/ui/RedeemInviteDialog";

const CARD_CLASS =
  "h-auto min-h-24 flex-col gap-2 whitespace-normal rounded-xl px-4 py-4 text-center";

export default function NoMembershipState() {
  const { t } = useTranslation();

  return (
    <section className="flex min-h-[52vh] items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          {t("root.dashboard.empty.eyebrow")}
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)] md:text-3xl">
          {t("root.dashboard.empty.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
          {t("root.dashboard.empty.description")}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {/* Create school — for admins setting up a new organization. */}
          <Button asChild variant="outline" size="lg" className={CARD_CLASS}>
            <Link href="/schools/new">
              <School className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {t("root.dashboard.empty.actions.createSchool")}
              </span>
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                {t("root.dashboard.empty.actions.createSchoolHint")}
              </span>
            </Link>
          </Button>

          {/* Join as student — the working school-code flow, the most common
              path for a new account. */}
          <JoinSchoolDialog
            trigger={
              <Button type="button" variant="outline" size="lg" className={CARD_CLASS}>
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {t("root.dashboard.empty.actions.joinStudent")}
                </span>
                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                  {t("root.dashboard.empty.actions.joinStudentHint")}
                </span>
              </Button>
            }
          />

          {/* Redeem a teacher invite — paste the unique invite link or token
              from the emailed invitation (POST /schools/invites/teacher/accept). */}
          <RedeemInviteDialog
            trigger={
              <Button type="button" variant="outline" size="lg" className={CARD_CLASS}>
                <TicketCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {t("root.dashboard.empty.actions.redeemInvite")}
                </span>
                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                  {t("root.dashboard.empty.actions.redeemInviteHint")}
                </span>
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}
