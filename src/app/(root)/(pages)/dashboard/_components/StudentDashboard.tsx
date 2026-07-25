"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import StudentOverviewCards from "@/app/(root)/(pages)/school/_components/StudentOverviewCards";

type StudentClass = { id: string; name: string };

type StudentDashboardProps = {
  fullName: string | null;
  schoolName: string | null;
  availableClasses: number;
  activeClasses: number;
  pendingRequests: number;
  classes: StudentClass[];
};

/**
 * The student home. Unlike the staff dashboard (which still shows reference
 * figures), this renders only real, session-backed data: the school overview
 * counts and the student's active roster. A student who has joined a school but
 * no classes gets an explicit "find your classes" next step instead of
 * fabricated stats, so the join-school → join-class journey never dead-ends.
 */
export default function StudentDashboard({
  fullName,
  schoolName,
  availableClasses,
  activeClasses,
  pendingRequests,
  classes,
}: StudentDashboardProps) {
  const { t } = useTranslation();

  const firstName = fullName?.trim().split(/\s+/)[0] ?? null;
  const hasClasses = activeClasses > 0 || classes.length > 0;

  return (
    <div className="space-y-6">
      <header>
        {schoolName ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {t("root.dashboard.student.eyebrow", { school: schoolName })}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">
          {firstName
            ? t("root.dashboard.student.welcomeTitle", { name: firstName })
            : t("root.dashboard.student.welcomeTitleGeneric")}
        </h1>
        {schoolName ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t("root.dashboard.student.subtitle", { school: schoolName })}
          </p>
        ) : null}
      </header>

      <StudentOverviewCards
        availableClasses={availableClasses}
        activeClasses={activeClasses}
        pendingRequests={pendingRequests}
      />

      {hasClasses ? (
        <EnrolledClasses classes={classes} pendingRequests={pendingRequests} />
      ) : (
        <FindYourClasses pendingRequests={pendingRequests} />
      )}
    </div>
  );
}

/** New student, zero classes: the guided next step toward enrolling. */
function FindYourClasses({ pendingRequests }: { pendingRequests: number }) {
  const { t } = useTranslation();

  const steps = [
    { key: "joined", done: true, label: t("root.dashboard.student.onboarding.steps.joined") },
    { key: "find", done: false, label: t("root.dashboard.student.onboarding.steps.find") },
    { key: "learn", done: false, label: t("root.dashboard.student.onboarding.steps.learn") },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
        {t("root.dashboard.student.onboarding.eyebrow")}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
        {t("root.dashboard.student.onboarding.title")}
      </h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
        {t("root.dashboard.student.onboarding.description")}
      </p>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={
                step.done
                  ? "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)]"
              }
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={
                step.done
                  ? "text-sm text-[var(--muted-foreground)] line-through"
                  : "text-sm font-medium text-[var(--foreground)]"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/groups/discover">
            <Compass className="h-4 w-4" />
            {t("root.dashboard.student.onboarding.browse")}
          </Link>
        </Button>
        {pendingRequests > 0 ? (
          <Button asChild variant="outline" size="lg">
            <Link href="/groups/requests">
              <Clock className="h-4 w-4" />
              {t("root.dashboard.student.onboarding.reviewRequests", {
                count: pendingRequests,
              })}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** Returning student: a compact list of active classes plus a browse entry. */
function EnrolledClasses({
  classes,
  pendingRequests,
}: {
  classes: StudentClass[];
  pendingRequests: number;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t("root.dashboard.student.myClasses.title")}
        </h2>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {t("root.dashboard.student.myClasses.viewAll")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {classes.map((item) => (
          <li key={item.id}>
            <Link
              href={`/groups/${item.id}`}
              className="flex items-center gap-3 py-3 transition-colors hover:text-[var(--primary)]"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                {item.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                {item.name}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </Link>
          </li>
        ))}
      </ul>

      {pendingRequests > 0 ? (
        <Link
          href="/groups/requests"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <Clock className="h-4 w-4" />
          {t("root.dashboard.student.onboarding.reviewRequests", { count: pendingRequests })}
        </Link>
      ) : null}
    </section>
  );
}
