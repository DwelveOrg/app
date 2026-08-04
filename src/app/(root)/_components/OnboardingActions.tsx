"use client";

import Link from "next/link";
import { GraduationCap, School, TicketCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import JoinSchoolDialog from "@/app/(root)/(pages)/_components/ui/RoleEmptyState/JoinSchoolDialog";
import RedeemInviteDialog from "@/app/(root)/(pages)/_components/ui/RedeemInviteDialog";
import { cn } from "@/lib/utils";

/**
 * The three ways into a school for an account that has no membership yet: create one (which makes
 * you its admin), join with a student code, or redeem a teacher invite.
 *
 * The dashboard empty state and the profile's "no active school" card each rendered this triple
 * by hand. They had already drifted — one showed a hint under each label and the other didn't,
 * and the icons were different sizes — so the same decision was presented as two different offers.
 *
 * The button only opens the flow; the action or credential behind it decides the resulting
 * membership role. There is deliberately no "I am a teacher" control here: teacher access is
 * email-bound because the role exposes answer keys.
 */
export type OnboardingActionsProps = {
  /**
   * `full` is the first-run dashboard state — roomier, with a hint under each label.
   * `compact` is the same three choices inside an existing card.
   */
  variant?: "full" | "compact";
  className?: string;
};

export default function OnboardingActions({
  variant = "full",
  className,
}: Readonly<OnboardingActionsProps>) {
  const { t } = useTranslation();
  const full = variant === "full";

  const buttonClass = cn(
    "h-auto flex-col whitespace-normal rounded-xl text-center",
    full ? "min-h-24 gap-2 px-4 py-4" : "min-h-20 gap-1.5 px-3 py-3",
  );
  const iconClass = full ? "size-5" : "size-4";

  const label = (key: string, hintKey: string) => (
    <>
      <span className="text-sm font-semibold">{t(key)}</span>
      {full ? (
        <span className="text-xs font-normal text-muted-foreground">{t(hintKey)}</span>
      ) : null}
    </>
  );

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", !full && "gap-2", className)}>
      {/* Create school — the action that makes the creator an admin. */}
      <Button asChild variant="outline" size="lg" className={buttonClass}>
        <Link href="/schools/new">
          <School className={iconClass} />
          {label(
            "root.dashboard.empty.actions.createSchool",
            "root.dashboard.empty.actions.createSchoolHint",
          )}
        </Link>
      </Button>

      {/* Join as student — the working school-code flow, the most common path for a new account. */}
      <JoinSchoolDialog
        trigger={
          <Button type="button" variant="outline" size="lg" className={buttonClass}>
            <GraduationCap className={iconClass} />
            {label(
              "root.dashboard.empty.actions.joinStudent",
              "root.dashboard.empty.actions.joinStudentHint",
            )}
          </Button>
        }
      />

      {/* Redeem a teacher invite — the unique link or token from the emailed invitation
          (POST /schools/invites/teacher/accept). */}
      <RedeemInviteDialog
        trigger={
          <Button type="button" variant="outline" size="lg" className={buttonClass}>
            <TicketCheck className={iconClass} />
            {label(
              "root.dashboard.empty.actions.redeemInvite",
              "root.dashboard.empty.actions.redeemInviteHint",
            )}
          </Button>
        }
      />
    </div>
  );
}

export { OnboardingActions };
