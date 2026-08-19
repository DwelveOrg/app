"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, School, TicketCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import JoinSchoolDialog from "@/app/(root)/(pages)/_components/ui/RoleEmptyState/JoinSchoolDialog";
import RedeemInviteDialog from "@/app/(root)/(pages)/_components/ui/RedeemInviteDialog";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The three ways into a school for an account that has no membership yet:
 * create one (which makes you its owner), join with a student code, or redeem a
 * teacher invite.
 *
 * ## Why these are cards rather than three identical buttons
 *
 * This is the first screen a new account sees, and it is a *fork* — the choice
 * decides what the product becomes for this person. The previous version drew
 * three outlined buttons of equal weight, which read as a toolbar: nothing on
 * screen said that "Create school" is the founding act and the other two are
 * redemptions of something you were given.
 *
 * So the cards carry the difference. Creating a school gets the brand tile, the
 * tinted panel, and first position, because it is the only option that works
 * without a credential from somebody else. The other two are quieter surfaces
 * that say what you need in hand before pressing them — a code, a link — which
 * is the fact that actually decides whether a given user can use them.
 *
 * There is deliberately no "I am a teacher" control: teacher access is
 * email-bound because the role exposes answer keys. The button only opens the
 * flow; the credential behind it decides the resulting role.
 */
export type OnboardingActionsProps = {
  /**
   * `full` is the first-run dashboard state — the cards, with their hints.
   * `compact` is the same three choices inside an existing card, where the
   * page around them has already done the explaining.
   */
  variant?: "full" | "compact";
  className?: string;
};

export default function OnboardingActions({
  variant = "full",
  className,
}: Readonly<OnboardingActionsProps>) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const full = variant === "full";

  if (!full) {
    // Inside a card the page has already made the pitch, so this stays a plain
    // row of buttons — three tinted panels nested in a panel would be noise.
    const buttonClass = "h-auto min-h-20 flex-col gap-1.5 whitespace-normal rounded-xl px-3 py-3 text-center";

    return (
      <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
        <Button asChild variant="outline" size="lg" className={buttonClass}>
          <Link href="/schools/new">
            <School className="size-4" />
            <span className="text-sm font-semibold">
              {t("root.dashboard.empty.actions.createSchool")}
            </span>
          </Link>
        </Button>

        <JoinSchoolDialog
          trigger={
            <Button type="button" variant="outline" size="lg" className={buttonClass}>
              <GraduationCap className="size-4" />
              <span className="text-sm font-semibold">
                {t("root.dashboard.empty.actions.joinStudent")}
              </span>
            </Button>
          }
        />

        <RedeemInviteDialog
          trigger={
            <Button type="button" variant="outline" size="lg" className={buttonClass}>
              <TicketCheck className="size-4" />
              <span className="text-sm font-semibold">
                {t("root.dashboard.empty.actions.redeemInvite")}
              </span>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={reduced ? stillVariants : staggerContainer}
      initial="hidden"
      animate="shown"
      className={cn("grid gap-3 text-left sm:grid-cols-3", className)}
    >
      {/* Create a school — the founding act, and the only one that needs
          nothing from anybody else. Hence the brand treatment. */}
      <EntryCard
        featured
        href="/schools/new"
        icon={School}
        title={t("root.dashboard.empty.actions.createSchool")}
        hint={t("root.dashboard.empty.actions.createSchoolHint")}
        note={t("root.dashboard.empty.actions.createSchoolNote")}
        reduced={Boolean(reduced)}
      />

      {/* Join as a student — the school code, the most common path. */}
      <JoinSchoolDialog
        trigger={
          <EntryCard
            asButton
            icon={GraduationCap}
            title={t("root.dashboard.empty.actions.joinStudent")}
            hint={t("root.dashboard.empty.actions.joinStudentHint")}
            note={t("root.dashboard.empty.actions.joinStudentNote")}
            reduced={Boolean(reduced)}
          />
        }
      />

      {/* Redeem a teacher invite — the unique, email-bound link. */}
      <RedeemInviteDialog
        trigger={
          <EntryCard
            asButton
            icon={TicketCheck}
            title={t("root.dashboard.empty.actions.redeemInvite")}
            hint={t("root.dashboard.empty.actions.redeemInviteHint")}
            note={t("root.dashboard.empty.actions.redeemInviteNote")}
            reduced={Boolean(reduced)}
          />
        }
      />
    </motion.div>
  );
}

/**
 * One route in.
 *
 * Two shapes, one look. `asButton` renders the card *as* the `<button>`, so a
 * dialog trigger can clone it with `asChild` without nesting one interactive
 * element inside another. `href` instead renders a plain container whose title
 * is the link, stretched over the card by a pseudo-element — the whole card is
 * clickable, but the accessibility tree holds exactly one link and that link is
 * named by its own text rather than by an `aria-label` that could drift from it.
 */
function EntryCard({
  icon: Icon,
  title,
  hint,
  note,
  href,
  featured = false,
  asButton = false,
  reduced,
  ...rest
}: {
  icon: typeof School;
  title: string;
  hint: string;
  note: string;
  href?: string;
  featured?: boolean;
  asButton?: boolean;
  reduced: boolean;
}) {
  const heading = href ? (
    <Link
      href={href}
      className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:underline"
    >
      {title}
    </Link>
  ) : (
    title
  );

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-[var(--dur-2)] ease-[var(--ease-out-quint)] [&_svg]:size-5",
          "group-hover:-translate-y-0.5",
          featured
            ? "bg-[image:var(--brand-gradient)] text-primary-foreground shadow-elev-brand"
            : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground",
        )}
      >
        <Icon />
      </span>

      <span className="mt-3 flex items-center gap-1.5">
        <span className="text-15 font-semibold text-foreground">{heading}</span>
        <ArrowRight
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 opacity-0 transition-all duration-[var(--dur-2)] ease-[var(--ease-out-quint)]",
            "-translate-x-1 group-hover:translate-x-0 group-hover:opacity-100",
            featured ? "text-primary" : "text-muted-foreground",
          )}
        />
      </span>

      <span className="mt-1 text-13 leading-relaxed text-muted-foreground">{hint}</span>

      {/*
        What you need in hand before this works. It is the fact that decides
        whether a route is even open to this user, so it is on the card rather
        than discovered inside the dialog.
      */}
      <span
        className={cn(
          "mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-2xs font-medium",
          featured ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {note}
      </span>
    </>
  );

  const className = cn(
    "group relative flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border p-4 text-left outline-none",
    "transition-[border-color,background-color,box-shadow,transform] duration-[var(--dur-2)] ease-[var(--ease-out-quint)]",
    "hover:-translate-y-0.5 hover:shadow-elev-2",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background",
    featured
      ? "border-primary/30 bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))] hover:border-primary/50"
      : "border-border bg-card hover:border-primary/35 hover:bg-accent/40",
  );

  return (
    <motion.div variants={reduced ? stillVariants : staggerItem} className="min-w-0">
      {asButton ? (
        // `rest` first so a trigger's own handlers and ref land on the button
        // while the card's own styling still wins.
        <button type="button" {...rest} className={className}>
          {body}
        </button>
      ) : (
        <div className={className}>{body}</div>
      )}
    </motion.div>
  );
}

export { OnboardingActions };
